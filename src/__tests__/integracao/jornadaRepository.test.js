const db = require('../../config/database');
const jornadaRepository = require('../../repositories/jornadaRepository');
const proximoPassoService = require('../../services/proximoPassoService');
const {
  limparBanco,
  criarUsuario,
  criarMateria,
  criarConteudo,
  criarQuestao,
  responder
} = require('./fixtures');

describe('jornada da conta (banco real)', () => {
  let usuarioId;

  beforeEach(async () => {
    await limparBanco();
    usuarioId = await criarUsuario();
  });

  afterAll(async () => {
    await db.pool.end();
  });

  const passo = () => proximoPassoService.getProximoPasso({ usuarioId });

  test('conta recem-criada esta na etapa de criar materia', async () => {
    const estado = await jornadaRepository.getEstadoDaConta(usuarioId);

    expect(estado).toEqual(
      expect.objectContaining({
        total_materias: 0,
        total_conteudos: 0,
        total_questoes: 0,
        total_respostas: 0,
        materia_sem_conteudo_id: null,
        conteudo_sem_questoes_id: null,
        conteudo_com_questoes_id: null,
        primeira_materia_id: null
      })
    );
    expect((await passo()).etapa).toBe('criar_materia');
  });

  test('materia vazia aponta para ela mesma', async () => {
    const materiaId = await criarMateria(usuarioId);
    const estado = await jornadaRepository.getEstadoDaConta(usuarioId);

    expect(estado.materia_sem_conteudo_id).toBe(materiaId);
    const resultado = await passo();
    expect(resultado.etapa).toBe('criar_conteudo');
    expect(resultado.acao.rota).toBe(`/materias/${materiaId}`);
  });

  test('conteudo sem questoes aponta para gerar material nele', async () => {
    const materiaId = await criarMateria(usuarioId);
    const conteudoId = await criarConteudo(usuarioId, materiaId);
    const estado = await jornadaRepository.getEstadoDaConta(usuarioId);

    expect(estado.materia_sem_conteudo_id).toBeNull();
    expect(estado.conteudo_sem_questoes_id).toBe(conteudoId);

    const resultado = await passo();
    expect(resultado.etapa).toBe('gerar_material');
    expect(resultado.acao.rota).toBe(`/conteudos/${conteudoId}`);
  });

  test('com questoes geradas passa a pedir respostas', async () => {
    const materiaId = await criarMateria(usuarioId);
    const conteudoId = await criarConteudo(usuarioId, materiaId);
    await criarQuestao(conteudoId);

    const estado = await jornadaRepository.getEstadoDaConta(usuarioId);
    expect(estado.conteudo_sem_questoes_id).toBeNull();
    expect(estado.conteudo_com_questoes_id).toBe(conteudoId);

    const resultado = await passo();
    expect(resultado.etapa).toBe('responder_questoes');
    expect(resultado.acao.rota).toBe(`/conteudos/${conteudoId}/questoes`);
  });

  test('conta fica pronta ao atingir o minimo de respostas', async () => {
    const materiaId = await criarMateria(usuarioId);
    const conteudoId = await criarConteudo(usuarioId, materiaId);
    const questao = await criarQuestao(conteudoId);

    const minimo = (await passo()).progresso.minimo_respostas;

    for (let i = 0; i < minimo - 1; i += 1) {
      await responder(usuarioId, questao, i % 2 === 0, { diasAtras: 1 });
    }

    const quaseLa = await passo();
    expect(quaseLa.etapa).toBe('responder_questoes');
    expect(quaseLa.progresso.respostas_faltantes).toBe(1);
    expect(quaseLa.titulo).toBe('Falta 1 resposta para liberar seu plano');

    await responder(usuarioId, questao, true, { diasAtras: 1 });

    const pronta = await passo();
    expect(pronta.etapa).toBe('pronto');
    expect(pronta.concluida).toBe(true);
    expect(pronta.progresso.respostas_faltantes).toBe(0);
  });

  test('materia nova sem conteudo reabre a etapa anterior', async () => {
    const materiaId = await criarMateria(usuarioId);
    const conteudoId = await criarConteudo(usuarioId, materiaId);
    await criarQuestao(conteudoId);
    expect((await passo()).etapa).toBe('responder_questoes');

    const materiaVazia = await criarMateria(usuarioId, 'Direito Civil');

    const resultado = await passo();
    expect(resultado.etapa).toBe('criar_conteudo');
    expect(resultado.acao.rota).toBe(`/materias/${materiaVazia}`);
  });

  test('nao enxerga dados de outro usuario', async () => {
    const outro = await criarUsuario('Outro');
    const materiaAlheia = await criarMateria(outro);
    const conteudoAlheio = await criarConteudo(outro, materiaAlheia);
    await criarQuestao(conteudoAlheio);

    const estado = await jornadaRepository.getEstadoDaConta(usuarioId);
    expect(estado.total_materias).toBe(0);
    expect(estado.total_conteudos).toBe(0);
    expect(estado.total_questoes).toBe(0);
    expect((await passo()).etapa).toBe('criar_materia');
  });

  test('nenhum estagio produz rota com id nulo', async () => {
    const vistos = new Set();
    const registrar = async () => {
      const r = await passo();
      expect(r.acao.rota).not.toMatch(/null|undefined/);
      vistos.add(r.etapa);
    };

    await registrar();
    const materiaId = await criarMateria(usuarioId);
    await registrar();
    const conteudoId = await criarConteudo(usuarioId, materiaId);
    await registrar();
    const questao = await criarQuestao(conteudoId);
    await registrar();
    for (let i = 0; i < 10; i += 1) {
      await responder(usuarioId, questao, true, { diasAtras: 1 });
    }
    await registrar();

    expect(vistos).toEqual(
      new Set(['criar_materia', 'criar_conteudo', 'gerar_material', 'responder_questoes', 'pronto'])
    );
  });
});
