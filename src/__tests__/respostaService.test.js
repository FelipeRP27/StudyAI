jest.mock('../repositories/respostaRepository', () => ({
  create: jest.fn(),
  findAllByQuestaoAndUserId: jest.fn()
}));

jest.mock('../repositories/alternativaRepository', () => ({
  findAllByQuestaoId: jest.fn()
}));

jest.mock('../services/questaoOwnershipService', () => ({
  ensureQuestaoOwnership: jest.fn()
}));

const respostaRepository = require('../repositories/respostaRepository');
const alternativaRepository = require('../repositories/alternativaRepository');
const questaoOwnershipService = require('../services/questaoOwnershipService');
const respostaService = require('../services/respostaService');
const AppError = require('../config/appError');

const ALTERNATIVAS = [
  { id: 10, questao_id: 1, texto: 'A', is_correta: false },
  { id: 11, questao_id: 1, texto: 'B', is_correta: true },
  { id: 12, questao_id: 1, texto: 'C', is_correta: false }
];

describe('respostaService.responder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    questaoOwnershipService.ensureQuestaoOwnership.mockResolvedValue({ id: 1 });
    alternativaRepository.findAllByQuestaoId.mockResolvedValue(ALTERNATIVAS);
    respostaRepository.create.mockImplementation(({ alternativaId, isCorreta }) =>
      Promise.resolve({
        id: 99,
        usuario_id: 7,
        questao_id: 1,
        alternativa_id: alternativaId,
        is_correta: isCorreta,
        created_at: '2026-05-04T10:00:00Z'
      })
    );
  });

  test('marca correta quando alternativa escolhida e a correta', async () => {
    const output = await respostaService.responder({
      questaoId: 1,
      alternativaId: 11,
      usuarioId: 7
    });

    expect(output.feedback.acertou).toBe(true);
    expect(output.feedback.alternativa_correta).toEqual({ id: 11, texto: 'B' });
    expect(respostaRepository.create).toHaveBeenCalledWith({
      usuarioId: 7,
      questaoId: 1,
      alternativaId: 11,
      isCorreta: true
    });
  });

  test('marca incorreta quando escolhe alternativa errada e ainda devolve a correta no feedback', async () => {
    const output = await respostaService.responder({
      questaoId: 1,
      alternativaId: 10,
      usuarioId: 7
    });

    expect(output.feedback.acertou).toBe(false);
    expect(output.feedback.alternativa_correta).toEqual({ id: 11, texto: 'B' });
    expect(respostaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ alternativaId: 10, isCorreta: false })
    );
  });

  test('lanca AppError quando alternativa nao pertence a questao', async () => {
    await expect(
      respostaService.responder({ questaoId: 1, alternativaId: 999, usuarioId: 7 })
    ).rejects.toThrow(AppError);
    expect(respostaRepository.create).not.toHaveBeenCalled();
  });

  test('propaga erro de ownership da questao sem persistir', async () => {
    questaoOwnershipService.ensureQuestaoOwnership.mockRejectedValue(
      new AppError('Questao not found', 404)
    );

    await expect(
      respostaService.responder({ questaoId: 1, alternativaId: 11, usuarioId: 7 })
    ).rejects.toThrow('Questao not found');
    expect(alternativaRepository.findAllByQuestaoId).not.toHaveBeenCalled();
    expect(respostaRepository.create).not.toHaveBeenCalled();
  });

  test('lanca AppError quando questao nao tem alternativas', async () => {
    alternativaRepository.findAllByQuestaoId.mockResolvedValue([]);

    await expect(
      respostaService.responder({ questaoId: 1, alternativaId: 1, usuarioId: 7 })
    ).rejects.toThrow(/does not have alternativas/);
  });
});
