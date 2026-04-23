jest.mock('../repositories/questaoRepository', () => ({
  create: jest.fn(),
  createAlternativa: jest.fn(),
  findAllByConteudoId: jest.fn(),
  findAlternativasByQuestaoIds: jest.fn()
}));

jest.mock('../services/conteudoOwnershipService', () => ({
  ensureConteudoOwnership: jest.fn()
}));

jest.mock('../services/iaService', () => ({
  generateJson: jest.fn()
}));

const questaoRepository = require('../repositories/questaoRepository');
const conteudoOwnershipService = require('../services/conteudoOwnershipService');
const iaService = require('../services/iaService');
const questaoService = require('../services/questaoService');
const AppError = require('../config/appError');

describe('questaoService.generateFromConteudo', () => {
  beforeEach(() => {
    conteudoOwnershipService.ensureConteudoOwnership.mockResolvedValue({
      id: 1,
      titulo: 'Direito Adm',
      texto: 'texto'
    });

    let questaoIdSeq = 1;
    let alternativaIdSeq = 1;

    questaoRepository.create.mockImplementation(({ conteudoId, enunciado }) =>
      Promise.resolve({
        id: questaoIdSeq++,
        conteudo_id: conteudoId,
        enunciado,
        created_at: '2026-04-22T00:00:00Z'
      })
    );

    questaoRepository.createAlternativa.mockImplementation(({ questaoId, texto, isCorreta }) =>
      Promise.resolve({
        id: alternativaIdSeq++,
        questao_id: questaoId,
        texto,
        is_correta: isCorreta,
        created_at: '2026-04-22T00:00:00Z'
      })
    );
  });

  test('persiste apenas questoes com >= 2 alternativas e exatamente 1 correta', async () => {
    iaService.generateJson.mockResolvedValue({
      questoes: [
        {
          enunciado: 'Q1 valida',
          alternativas: [
            { texto: 'a', is_correta: false },
            { texto: 'b', is_correta: true },
            { texto: 'c', is_correta: false }
          ]
        },
        {
          enunciado: 'Q2 com duas corretas (deve ser filtrada)',
          alternativas: [
            { texto: 'a', is_correta: true },
            { texto: 'b', is_correta: true }
          ]
        },
        {
          enunciado: 'Q3 com apenas 1 alternativa (deve ser filtrada)',
          alternativas: [{ texto: 'a', is_correta: true }]
        },
        {
          enunciado: 'Q4 sem correta (deve ser filtrada)',
          alternativas: [
            { texto: 'a', is_correta: false },
            { texto: 'b', is_correta: false }
          ]
        }
      ]
    });

    const output = await questaoService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 });

    expect(output).toHaveLength(1);
    expect(output[0].enunciado).toBe('Q1 valida');
    expect(output[0].alternativas).toHaveLength(3);
    expect(questaoRepository.create).toHaveBeenCalledTimes(1);
    expect(questaoRepository.createAlternativa).toHaveBeenCalledTimes(3);
  });

  test('lanca AppError quando IA retorna lista vazia', async () => {
    iaService.generateJson.mockResolvedValue({ questoes: [] });

    await expect(
      questaoService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 })
    ).rejects.toThrow(AppError);
  });

  test('lanca AppError quando todas as questoes sao filtradas como invalidas', async () => {
    iaService.generateJson.mockResolvedValue({
      questoes: [
        {
          enunciado: 'so 1 alternativa',
          alternativas: [{ texto: 'a', is_correta: true }]
        }
      ]
    });

    await expect(
      questaoService.generateFromConteudo({ conteudoId: 1, usuarioId: 2 })
    ).rejects.toThrow(/Nenhuma questao valida/);
    expect(questaoRepository.create).not.toHaveBeenCalled();
  });
});
