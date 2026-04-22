jest.mock('../repositories/pontoChaveRepository', () => ({
  create: jest.fn(),
  findAllByConteudoId: jest.fn()
}));

jest.mock('../services/conteudoOwnershipService', () => ({
  ensureConteudoOwnership: jest.fn()
}));

jest.mock('../services/iaService', () => ({
  generateJson: jest.fn()
}));

const pontoChaveRepository = require('../repositories/pontoChaveRepository');
const conteudoOwnershipService = require('../services/conteudoOwnershipService');
const iaService = require('../services/iaService');
const pontoChaveService = require('../services/pontoChaveService');
const AppError = require('../config/appError');

describe('pontoChaveService.generateFromConteudo', () => {
  beforeEach(() => {
    conteudoOwnershipService.ensureConteudoOwnership.mockResolvedValue({
      id: 1,
      titulo: 'Principios',
      texto: 'conteudo'
    });

    let idSeq = 1;
    pontoChaveRepository.create.mockImplementation(({ conteudoId, texto }) =>
      Promise.resolve({
        id: idSeq++,
        conteudo_id: conteudoId,
        texto,
        created_at: '2026-04-22T00:00:00Z'
      })
    );
  });

  test('persiste apenas pontos-chave nao vazios e faz trim', async () => {
    iaService.generateJson.mockResolvedValue({
      pontos_chave: ['  legalidade  ', '', 'impessoalidade', '   ', 'moralidade']
    });

    const output = await pontoChaveService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 });

    expect(output).toHaveLength(3);
    expect(output[0].texto).toBe('legalidade');
    expect(output[1].texto).toBe('impessoalidade');
    expect(output[2].texto).toBe('moralidade');
    expect(pontoChaveRepository.create).toHaveBeenCalledTimes(3);
  });

  test('lanca AppError quando IA retorna lista vazia', async () => {
    iaService.generateJson.mockResolvedValue({ pontos_chave: [] });

    await expect(
      pontoChaveService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 })
    ).rejects.toThrow(AppError);
    expect(pontoChaveRepository.create).not.toHaveBeenCalled();
  });

  test('lanca AppError quando todos os pontos sao filtrados', async () => {
    iaService.generateJson.mockResolvedValue({
      pontos_chave: ['', '   ', null, 42]
    });

    await expect(
      pontoChaveService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 })
    ).rejects.toThrow(/Nenhum ponto-chave valido/);
    expect(pontoChaveRepository.create).not.toHaveBeenCalled();
  });

  test('propaga erro de ownership sem chamar IA', async () => {
    conteudoOwnershipService.ensureConteudoOwnership.mockRejectedValue(
      new AppError('Conteudo not found', 404)
    );

    await expect(
      pontoChaveService.generateFromConteudo({ conteudoId: 99, usuarioId: 2 })
    ).rejects.toThrow('Conteudo not found');
    expect(iaService.generateJson).not.toHaveBeenCalled();
  });
});
