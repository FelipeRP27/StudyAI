jest.mock('../repositories/jornadaRepository');

const jornadaRepository = require('../repositories/jornadaRepository');
const proximoPassoService = require('../services/proximoPassoService');

const ESTADO_BASE = {
  total_materias: 0,
  total_conteudos: 0,
  total_questoes: 0,
  total_respostas: 0,
  materia_sem_conteudo_id: null,
  conteudo_sem_questoes_id: null,
  conteudo_com_questoes_id: null,
  primeira_materia_id: null
};

function comEstado(parcial) {
  jornadaRepository.getEstadoDaConta.mockResolvedValue({ ...ESTADO_BASE, ...parcial });
  return proximoPassoService.getProximoPasso({ usuarioId: 1 });
}

describe('proximoPassoService', () => {
  test('conta sem materia e orientada a criar a primeira', async () => {
    const saida = await comEstado({});

    expect(saida.etapa).toBe('criar_materia');
    expect(saida.acao).toEqual({ rotulo: 'Criar matéria', rota: '/materias' });
    expect(saida.concluida).toBe(false);
  });

  test('materia sem conteudo aponta para a propria materia', async () => {
    const saida = await comEstado({
      total_materias: 1,
      materia_sem_conteudo_id: 7,
      primeira_materia_id: 7
    });

    expect(saida.etapa).toBe('criar_conteudo');
    expect(saida.acao.rota).toBe('/materias/7');
  });

  test('conteudo sem questoes aponta para gerar material nele', async () => {
    const saida = await comEstado({
      total_materias: 1,
      total_conteudos: 1,
      primeira_materia_id: 7,
      conteudo_sem_questoes_id: 42
    });

    expect(saida.etapa).toBe('gerar_material');
    expect(saida.acao.rota).toBe('/conteudos/42');
  });

  test('com questoes e sem respostas leva a responder', async () => {
    const saida = await comEstado({
      total_materias: 1,
      total_conteudos: 1,
      total_questoes: 5,
      primeira_materia_id: 7,
      conteudo_com_questoes_id: 42
    });

    expect(saida.etapa).toBe('responder_questoes');
    expect(saida.acao.rota).toBe('/conteudos/42/questoes');
    expect(saida.titulo).toBe('Responda suas primeiras questões');
    expect(saida.progresso.respostas_faltantes).toBe(saida.progresso.minimo_respostas);
  });

  test('informa quantas respostas faltam para liberar o plano', async () => {
    const saida = await comEstado({
      total_materias: 1,
      total_conteudos: 1,
      total_questoes: 5,
      total_respostas: 9,
      primeira_materia_id: 7,
      conteudo_com_questoes_id: 42
    });

    expect(saida.progresso.respostas_faltantes).toBe(1);
    expect(saida.titulo).toBe('Falta 1 resposta para liberar seu plano');
  });

  test('conta com dados suficientes fica pronta', async () => {
    const saida = await comEstado({
      total_materias: 2,
      total_conteudos: 3,
      total_questoes: 20,
      total_respostas: 10,
      primeira_materia_id: 7,
      conteudo_com_questoes_id: 42
    });

    expect(saida.etapa).toBe('pronto');
    expect(saida.concluida).toBe(true);
    expect(saida.acao.rota).toBe('/plano');
    expect(saida.trilha.every((item) => item.concluida)).toBe(true);
  });

  test('trilha marca a etapa atual e as anteriores como concluidas', async () => {
    const saida = await comEstado({
      total_materias: 1,
      total_conteudos: 1,
      primeira_materia_id: 7,
      conteudo_sem_questoes_id: 42
    });

    expect(saida.trilha).toEqual([
      { etapa: 'criar_materia', rotulo: 'Criar matéria', concluida: true, atual: false },
      { etapa: 'criar_conteudo', rotulo: 'Adicionar conteúdo', concluida: true, atual: false },
      { etapa: 'gerar_material', rotulo: 'Gerar material', concluida: false, atual: true },
      { etapa: 'responder_questoes', rotulo: 'Responder questões', concluida: false, atual: false }
    ]);
  });

  test('nenhuma etapa aponta para rota com id nulo', async () => {
    const cenarios = [
      {},
      { total_materias: 1, materia_sem_conteudo_id: 7, primeira_materia_id: 7 },
      { total_materias: 1, total_conteudos: 1, primeira_materia_id: 7, conteudo_sem_questoes_id: 42 },
      {
        total_materias: 1,
        total_conteudos: 1,
        total_questoes: 5,
        primeira_materia_id: 7,
        conteudo_com_questoes_id: 42
      }
    ];

    for (const cenario of cenarios) {
      const saida = await comEstado(cenario);
      expect(saida.acao.rota).not.toMatch(/null|undefined/);
    }
  });
});
