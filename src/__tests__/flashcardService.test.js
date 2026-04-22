jest.mock('../repositories/flashcardRepository', () => ({
  create: jest.fn(),
  findAllByConteudoId: jest.fn()
}));

jest.mock('../services/conteudoOwnershipService', () => ({
  ensureConteudoOwnership: jest.fn()
}));

jest.mock('../services/iaService', () => ({
  generateJson: jest.fn()
}));

const flashcardRepository = require('../repositories/flashcardRepository');
const conteudoOwnershipService = require('../services/conteudoOwnershipService');
const iaService = require('../services/iaService');
const flashcardService = require('../services/flashcardService');
const AppError = require('../config/appError');

describe('flashcardService.generateFromConteudo', () => {
  beforeEach(() => {
    conteudoOwnershipService.ensureConteudoOwnership.mockResolvedValue({
      id: 1,
      titulo: 'Atos Administrativos',
      texto: 'conteudo'
    });

    let idSeq = 1;
    flashcardRepository.create.mockImplementation(({ conteudoId, frente, verso }) =>
      Promise.resolve({
        id: idSeq++,
        conteudo_id: conteudoId,
        frente,
        verso,
        created_at: '2026-04-22T00:00:00Z'
      })
    );
  });

  test('persiste apenas flashcards com frente e verso nao vazios', async () => {
    iaService.generateJson.mockResolvedValue({
      flashcards: [
        { frente: '  O que e ato administrativo?  ', verso: 'Manifestacao da administracao' },
        { frente: '', verso: 'verso sem frente' },
        { frente: 'so frente', verso: '   ' },
        { frente: 'Requisitos do ato', verso: 'competencia, finalidade, forma, motivo, objeto' }
      ]
    });

    const output = await flashcardService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 });

    expect(output).toHaveLength(2);
    expect(output[0].frente).toBe('O que e ato administrativo?');
    expect(output[1].frente).toBe('Requisitos do ato');
    expect(flashcardRepository.create).toHaveBeenCalledTimes(2);
  });

  test('lanca AppError quando IA retorna lista vazia', async () => {
    iaService.generateJson.mockResolvedValue({ flashcards: [] });

    await expect(
      flashcardService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 })
    ).rejects.toThrow(AppError);
    expect(flashcardRepository.create).not.toHaveBeenCalled();
  });

  test('lanca AppError quando todos os flashcards sao filtrados', async () => {
    iaService.generateJson.mockResolvedValue({
      flashcards: [
        { frente: '', verso: 'vazio' },
        { frente: 'so frente', verso: '' }
      ]
    });

    await expect(
      flashcardService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 })
    ).rejects.toThrow(/Nenhum flashcard valido/);
    expect(flashcardRepository.create).not.toHaveBeenCalled();
  });

  test('propaga erro de ownership sem chamar IA', async () => {
    conteudoOwnershipService.ensureConteudoOwnership.mockRejectedValue(
      new AppError('Conteudo not found', 404)
    );

    await expect(
      flashcardService.generateFromConteudo({ conteudoId: 99, usuarioId: 2 })
    ).rejects.toThrow('Conteudo not found');
    expect(iaService.generateJson).not.toHaveBeenCalled();
  });
});
