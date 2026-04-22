jest.mock('../repositories/resumoRepository', () => ({
  create: jest.fn(),
  findAllByConteudoId: jest.fn()
}));

jest.mock('../services/conteudoOwnershipService', () => ({
  ensureConteudoOwnership: jest.fn()
}));

jest.mock('../services/iaService', () => ({
  generateJson: jest.fn()
}));

const resumoRepository = require('../repositories/resumoRepository');
const conteudoOwnershipService = require('../services/conteudoOwnershipService');
const iaService = require('../services/iaService');
const resumoService = require('../services/resumoService');
const AppError = require('../config/appError');

describe('resumoService.generateFromConteudo', () => {
  beforeEach(() => {
    conteudoOwnershipService.ensureConteudoOwnership.mockResolvedValue({
      id: 1,
      titulo: 'Principios',
      texto: 'conteudo teorico'
    });
  });

  test('gera resumo via IA e persiste', async () => {
    iaService.generateJson.mockResolvedValue({ resumo: '  resumo gerado  ' });
    resumoRepository.create.mockResolvedValue({
      id: 10,
      conteudo_id: 1,
      texto: 'resumo gerado',
      created_at: '2026-04-22T00:00:00Z'
    });

    const output = await resumoService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 });

    expect(conteudoOwnershipService.ensureConteudoOwnership).toHaveBeenCalledWith(1, 2);
    expect(iaService.generateJson).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: expect.any(String), systemInstruction: expect.any(String) })
    );
    expect(resumoRepository.create).toHaveBeenCalledWith({ conteudoId: 1, texto: 'resumo gerado' });
    expect(output).toMatchObject({ id: 10, texto: 'resumo gerado' });
  });

  test('lanca AppError 502 quando IA retorna payload vazio', async () => {
    iaService.generateJson.mockResolvedValue({ resumo: '   ' });

    await expect(
      resumoService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 })
    ).rejects.toThrow(AppError);
    expect(resumoRepository.create).not.toHaveBeenCalled();
  });

  test('propaga erro de ownership (404) sem chamar IA', async () => {
    conteudoOwnershipService.ensureConteudoOwnership.mockRejectedValue(
      new AppError('Conteudo not found', 404)
    );

    await expect(
      resumoService.generateFromConteudo({ conteudoId: 99, usuarioId: 2 })
    ).rejects.toThrow('Conteudo not found');
    expect(iaService.generateJson).not.toHaveBeenCalled();
  });
});
