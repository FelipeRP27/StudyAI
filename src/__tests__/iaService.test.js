jest.mock('../config/env', () => ({
  env: { geminiApiKey: 'fake-key', geminiModel: 'gemini-2.5-flash' }
}));

jest.mock('../repositories/iaCacheRepository', () => ({
  findByHash: jest.fn().mockResolvedValue(null),
  upsert: jest.fn().mockResolvedValue(undefined)
}));

const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({ generateContent: mockGenerateContent })
  }))
}));

const iaCacheRepository = require('../repositories/iaCacheRepository');

const { extractJsonPayload, mapProviderError, generateJson } = require('../services/iaService');
const AppError = require('../config/appError');

describe('iaService.extractJsonPayload', () => {
  test('parseia JSON puro', () => {
    const result = extractJsonPayload('{"resumo": "ok"}');
    expect(result).toEqual({ resumo: 'ok' });
  });

  test('parseia JSON dentro de bloco cercado ```json', () => {
    const text = 'Aqui vai o JSON:\n```json\n{"pontos_chave": ["a", "b"]}\n```';
    const result = extractJsonPayload(text);
    expect(result).toEqual({ pontos_chave: ['a', 'b'] });
  });

  test('parseia JSON dentro de bloco cercado generico', () => {
    const text = '```\n{"flashcards": []}\n```';
    const result = extractJsonPayload(text);
    expect(result).toEqual({ flashcards: [] });
  });

  test('parseia array JSON quando o primeiro char valido e [', () => {
    const result = extractJsonPayload('prefixo [1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  test('lanca AppError quando texto nao e string', () => {
    expect(() => extractJsonPayload(null)).toThrow(AppError);
    expect(() => extractJsonPayload(undefined)).toThrow(AppError);
  });

  test('lanca AppError quando nao ha JSON no texto', () => {
    expect(() => extractJsonPayload('resposta sem JSON')).toThrow(/nao contem JSON/);
  });

  test('lanca AppError quando JSON e invalido', () => {
    expect(() => extractJsonPayload('{ invalido: true }')).toThrow(/interpretar JSON/);
  });
});

describe('iaService.mapProviderError', () => {
  test('mapeia 401 para credenciais invalidas', () => {
    const err = mapProviderError({ status: 401, message: 'unauthorized' });
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(502);
    expect(err.message).toMatch(/invalida/);
  });

  test('mapeia 429 para rate limit', () => {
    const err = mapProviderError({ status: 429, message: 'rate limited' });
    expect(err.statusCode).toBe(429);
    expect(err.message).toMatch(/Limite/);
  });

  test('mapeia 5xx para provedor indisponivel', () => {
    const err = mapProviderError({ status: 503, message: 'outage' });
    expect(err.statusCode).toBe(502);
    expect(err.message).toMatch(/indisponivel/);
  });

  test('mapeia erro generico mantendo mensagem', () => {
    const err = mapProviderError({ message: 'timeout' });
    expect(err.statusCode).toBe(502);
    expect(err.message).toMatch(/timeout/);
  });
});

describe('iaService.generateJson (retry)', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    iaCacheRepository.findByHash.mockResolvedValue(null);
    iaCacheRepository.upsert.mockResolvedValue(undefined);
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    console.error.mockRestore();
    console.log.mockRestore();
  });

  test('retorna direto do cache quando ha hit, sem chamar o provedor', async () => {
    iaCacheRepository.findByHash.mockResolvedValueOnce({
      hash: 'h',
      modelo: 'gemini-2.5-flash',
      payload: { resumo: 'cached' },
      created_at: '2026-05-10T00:00:00Z'
    });

    const result = await generateJson({ prompt: 'p', systemInstruction: 's' });

    expect(result).toEqual({ resumo: 'cached' });
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(iaCacheRepository.upsert).not.toHaveBeenCalled();
  });

  test('retenta em erro 503 e retorna sucesso na segunda tentativa', async () => {
    mockGenerateContent
      .mockRejectedValueOnce({ status: 503, message: 'indisponivel' })
      .mockResolvedValueOnce({ response: { text: () => '{"resumo":"ok"}' } });

    const promise = generateJson({ prompt: 'p', systemInstruction: 's' });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ resumo: 'ok' });
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  test('retenta em erro 429 ate o limite e mapeia o erro final', async () => {
    mockGenerateContent.mockRejectedValue({ status: 429, message: 'rate' });

    const promise = generateJson({ prompt: 'p', systemInstruction: 's' }).catch((e) => e);
    await jest.runAllTimersAsync();
    const resultado = await promise;

    expect(resultado).toBeInstanceOf(AppError);
    expect(resultado.message).toMatch(/Limite/);
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  test('nao retenta em erro nao-retryable (401)', async () => {
    mockGenerateContent.mockRejectedValue({ status: 401, message: 'unauthorized' });

    const promise = generateJson({ prompt: 'p', systemInstruction: 's' }).catch((e) => e);
    await jest.runAllTimersAsync();
    const resultado = await promise;

    expect(resultado).toBeInstanceOf(AppError);
    expect(resultado.message).toMatch(/invalida/);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
