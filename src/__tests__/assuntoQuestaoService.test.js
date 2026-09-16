jest.mock('../repositories/questaoRepository', () => ({
  findConteudosComQuestoesSemAssunto: jest.fn(),
  findSemAssuntoByConteudoId: jest.fn(),
  updateAssunto: jest.fn()
}));

jest.mock('../services/iaService', () => ({
  generateJson: jest.fn()
}));

const questaoRepository = require('../repositories/questaoRepository');
const iaService = require('../services/iaService');
const assuntoQuestaoService = require('../services/assuntoQuestaoService');
const { normalizarAssunto } = require('../dtos/assuntoInputDto');

describe('assuntoInputDto.normalizarAssunto', () => {
  test('remove espacos extras, capitaliza e limita o tamanho', () => {
    expect(normalizarAssunto('  anulacao   e revogacao ')).toBe('Anulacao e revogacao');
    expect(normalizarAssunto('x'.repeat(200))).toHaveLength(120);
  });

  test('devolve null para valores vazios ou que nao sao texto', () => {
    expect(normalizarAssunto('   ')).toBeNull();
    expect(normalizarAssunto(undefined)).toBeNull();
    expect(normalizarAssunto(42)).toBeNull();
  });
});

describe('assuntoQuestaoService.mapearAssuntosValidos', () => {
  test('aceita apenas ids enviados, primeiro assunto valido de cada questao', () => {
    const assuntos = assuntoQuestaoService.mapearAssuntosValidos(
      {
        assuntos: [
          { questao_id: 1, assunto: 'Licitacao dispensada' },
          { questao_id: '2', assunto: 'Modalidades' },
          { questao_id: 1, assunto: 'Duplicado' },
          { questao_id: 99, assunto: 'Questao de outro conteudo' },
          { questao_id: 3, assunto: '' }
        ]
      },
      [{ id: 1 }, { id: 2 }, { id: 3 }]
    );

    expect([...assuntos.entries()]).toEqual([
      [1, 'Licitacao dispensada'],
      [2, 'Modalidades']
    ]);
  });

  test('tolera payload fora do formato', () => {
    expect(assuntoQuestaoService.mapearAssuntosValidos({ foo: 1 }, [{ id: 1 }]).size).toBe(0);
  });
});

describe('assuntoQuestaoService.classificarQuestoesSemAssunto', () => {
  test('classifica por conteudo, grava os assuntos e registra falhas sem interromper', async () => {
    questaoRepository.findConteudosComQuestoesSemAssunto.mockResolvedValue([
      { id: 1, titulo: 'Licitacoes', texto: 'texto 1' },
      { id: 2, titulo: 'Atos', texto: 'texto 2' }
    ]);
    questaoRepository.findSemAssuntoByConteudoId.mockImplementation((conteudoId) =>
      Promise.resolve(
        conteudoId === 1
          ? [
              { id: 10, enunciado: 'Q10' },
              { id: 11, enunciado: 'Q11' }
            ]
          : [{ id: 20, enunciado: 'Q20' }]
      )
    );
    iaService.generateJson
      .mockResolvedValueOnce({ assuntos: [{ questao_id: 10, assunto: 'modalidades' }] })
      .mockRejectedValueOnce(new Error('Provedor de IA indisponivel no momento'));

    const relatorio = await assuntoQuestaoService.classificarQuestoesSemAssunto();

    expect(iaService.generateJson).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.2, prompt: expect.stringContaining('[id 11] Q11') })
    );
    expect(questaoRepository.updateAssunto).toHaveBeenCalledTimes(1);
    expect(questaoRepository.updateAssunto).toHaveBeenCalledWith({ id: 10, assunto: 'Modalidades' });
    expect(relatorio).toEqual({
      conteudos: 2,
      classificadas: 1,
      sem_assunto: 1,
      falhas: [{ conteudo_id: 2, erro: 'Provedor de IA indisponivel no momento' }]
    });
  });
});
