const { extractJsonPayload, mapProviderError } = require('../services/iaService');
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
