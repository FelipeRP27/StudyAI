jest.mock('../repositories/processamentoRepository', () => ({
  create: jest.fn(),
  markConcluido: jest.fn(),
  markErro: jest.fn(),
  findAllByConteudoId: jest.fn()
}));

jest.mock('../services/conteudoOwnershipService', () => ({
  ensureConteudoOwnership: jest.fn()
}));

jest.mock('../services/resumoService', () => ({
  generateFromConteudo: jest.fn()
}));

jest.mock('../services/pontoChaveService', () => ({
  generateFromConteudo: jest.fn()
}));

jest.mock('../services/questaoService', () => ({
  generateFromConteudo: jest.fn()
}));

jest.mock('../services/flashcardService', () => ({
  generateFromConteudo: jest.fn()
}));

const processamentoRepository = require('../repositories/processamentoRepository');
const conteudoOwnershipService = require('../services/conteudoOwnershipService');
const resumoService = require('../services/resumoService');
const pontoChaveService = require('../services/pontoChaveService');
const questaoService = require('../services/questaoService');
const flashcardService = require('../services/flashcardService');
const processamentoService = require('../services/processamentoService');
const AppError = require('../config/appError');

describe('processamentoService.processarConteudo', () => {
  beforeEach(() => {
    conteudoOwnershipService.ensureConteudoOwnership.mockResolvedValue({ id: 1 });

    let idSeq = 100;
    processamentoRepository.create.mockImplementation(({ tipo }) =>
      Promise.resolve({
        id: idSeq++,
        tipo,
        status: 'processando',
        iniciado_em: '2026-04-22T00:00:00Z'
      })
    );
    processamentoRepository.markConcluido.mockImplementation((id) =>
      Promise.resolve({ id, status: 'concluido' })
    );
    processamentoRepository.markErro.mockImplementation((id, erro) =>
      Promise.resolve({ id, status: 'erro', erro })
    );
  });

  test('dispara todas as geracoes por padrao e marca processamento completo como concluido', async () => {
    resumoService.generateFromConteudo.mockResolvedValue({ id: 1 });
    pontoChaveService.generateFromConteudo.mockResolvedValue([]);
    questaoService.generateFromConteudo.mockResolvedValue([]);
    flashcardService.generateFromConteudo.mockResolvedValue([]);

    const output = await processamentoService.processarConteudo({
      conteudoId: 1,
      usuarioId: 2
    });

    expect(output.tipos_executados).toEqual([
      'resumo',
      'pontos_chave',
      'questoes',
      'flashcards'
    ]);
    expect(output.tipos_com_erro).toEqual([]);
    expect(resumoService.generateFromConteudo).toHaveBeenCalledTimes(1);
    expect(pontoChaveService.generateFromConteudo).toHaveBeenCalledTimes(1);
    expect(questaoService.generateFromConteudo).toHaveBeenCalledTimes(1);
    expect(flashcardService.generateFromConteudo).toHaveBeenCalledTimes(1);

    // 4 sub-processamentos + 1 completo
    expect(processamentoRepository.create).toHaveBeenCalledTimes(5);
    // 4 sub + 1 completo concluidos
    expect(processamentoRepository.markConcluido).toHaveBeenCalledTimes(5);
  });

  test('registra erro individual mas segue gerando outros tipos', async () => {
    resumoService.generateFromConteudo.mockRejectedValue(new AppError('falha resumo', 502));
    pontoChaveService.generateFromConteudo.mockResolvedValue([]);
    questaoService.generateFromConteudo.mockResolvedValue([]);
    flashcardService.generateFromConteudo.mockResolvedValue([]);

    const output = await processamentoService.processarConteudo({
      conteudoId: 1,
      usuarioId: 2
    });

    expect(output.tipos_com_erro).toEqual(['resumo']);
    expect(output.resultados.resumo.status).toBe('erro');
    expect(output.resultados.resumo.erro).toBe('falha resumo');
    expect(output.resultados.pontos_chave.status).toBe('concluido');

    // 1 markErro (resumo) + 4 markConcluido (pontos, questoes, flashcards, completo)
    expect(processamentoRepository.markErro).toHaveBeenCalledTimes(1);
    expect(processamentoRepository.markConcluido).toHaveBeenCalledTimes(4);
  });

  test('marca processamento completo como erro quando todas as geracoes falham', async () => {
    resumoService.generateFromConteudo.mockRejectedValue(new AppError('e1', 502));
    pontoChaveService.generateFromConteudo.mockRejectedValue(new AppError('e2', 502));
    questaoService.generateFromConteudo.mockRejectedValue(new AppError('e3', 502));
    flashcardService.generateFromConteudo.mockRejectedValue(new AppError('e4', 502));

    const output = await processamentoService.processarConteudo({
      conteudoId: 1,
      usuarioId: 2
    });

    expect(output.tipos_com_erro).toHaveLength(4);
    // 4 sub markErro + 1 completo markErro
    expect(processamentoRepository.markErro).toHaveBeenCalledTimes(5);
    expect(processamentoRepository.markConcluido).not.toHaveBeenCalled();
  });

  test('respeita tipos customizados quando informados', async () => {
    resumoService.generateFromConteudo.mockResolvedValue({ id: 1 });

    const output = await processamentoService.processarConteudo({
      conteudoId: 1,
      usuarioId: 2,
      tipos: ['resumo']
    });

    expect(output.tipos_executados).toEqual(['resumo']);
    expect(resumoService.generateFromConteudo).toHaveBeenCalledTimes(1);
    expect(pontoChaveService.generateFromConteudo).not.toHaveBeenCalled();
    expect(questaoService.generateFromConteudo).not.toHaveBeenCalled();
    expect(flashcardService.generateFromConteudo).not.toHaveBeenCalled();
  });
});
