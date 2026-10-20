const db = require('../../config/database');
const respostaRepository = require('../../repositories/respostaRepository');
const {
  limparBanco,
  criarUsuario,
  criarMateria,
  criarConteudo,
  criarQuestao,
  responder
} = require('./fixtures');

describe('respostaRepository (banco real)', () => {
  let usuarioId;
  let materiaId;
  let conteudoId;
  let questaoA;
  let questaoB;

  beforeEach(async () => {
    await limparBanco();
    usuarioId = await criarUsuario();
    materiaId = await criarMateria(usuarioId);
    conteudoId = await criarConteudo(usuarioId, materiaId);
    questaoA = await criarQuestao(conteudoId, { enunciado: 'A', assunto: 'Anulacao' });
    questaoB = await criarQuestao(conteudoId, { enunciado: 'B', assunto: 'Revogacao' });
  });

  afterAll(async () => {
    await db.pool.end();
  });

  test('resume acertos e erros do usuario', async () => {
    await responder(usuarioId, questaoA, true);
    await responder(usuarioId, questaoA, false);
    await responder(usuarioId, questaoB, false);

    const outroUsuario = await criarUsuario('Outro');
    await responder(outroUsuario, questaoA, true);

    expect(await respostaRepository.getDesempenhoResumo(usuarioId)).toEqual({
      total_respostas: 3,
      total_acertos: 1,
      total_erros: 2
    });
  });

  test('agrega desempenho por materia e por conteudo com a ultima resposta', async () => {
    const outraMateria = await criarMateria(usuarioId, 'Direito Civil');
    const outroConteudo = await criarConteudo(usuarioId, outraMateria, 'Posse');
    const questaoCivil = await criarQuestao(outroConteudo);

    await responder(usuarioId, questaoA, true, { diasAtras: 3 });
    await responder(usuarioId, questaoB, false, { diasAtras: 1 });
    await responder(usuarioId, questaoCivil, true, { diasAtras: 2 });

    const porMateria = await respostaRepository.getDesempenhoPorMateria(usuarioId);
    expect(porMateria).toEqual([
      expect.objectContaining({ materia_nome: 'Direito Administrativo', total_respostas: 2, total_acertos: 1 }),
      expect.objectContaining({ materia_nome: 'Direito Civil', total_respostas: 1, total_acertos: 1 })
    ]);

    const porConteudo = await respostaRepository.getDesempenhoPorConteudo(usuarioId);
    const administrativo = porConteudo.find((linha) => linha.conteudo_id === conteudoId);
    expect(administrativo).toEqual(
      expect.objectContaining({ total_respostas: 2, total_acertos: 1, materia_id: materiaId })
    );

    const diferencaEmDias =
      (Date.now() - new Date(administrativo.ultima_resposta_em).getTime()) / 86400000;
    expect(diferencaEmDias).toBeLessThan(2);
  });

  test('janela recente considera apenas as ultimas respostas de cada conteudo', async () => {
    for (let i = 0; i < 4; i += 1) {
      await responder(usuarioId, questaoA, false, { diasAtras: 10 - i });
    }
    await responder(usuarioId, questaoA, true, { diasAtras: 2 });
    await responder(usuarioId, questaoB, true, { diasAtras: 1 });

    const [linha] = await respostaRepository.getDesempenhoRecentePorConteudo(usuarioId, 3);

    expect(linha).toEqual({
      conteudo_id: conteudoId,
      respostas_recentes: 3,
      acertos_recentes: 2
    });
  });

  test('sessoes recentes agrupam respostas do mesmo dia', async () => {
    await responder(usuarioId, questaoA, false, { diasAtras: 4, horas: 9 });
    await responder(usuarioId, questaoB, true, { diasAtras: 4, horas: 20 });
    await responder(usuarioId, questaoA, true, { diasAtras: 2 });
    await responder(usuarioId, questaoA, false, { diasAtras: 1 });

    const comTresSessoes = await respostaRepository.getSessoesRecentesPorConteudo(usuarioId, 3);
    expect(comTresSessoes).toEqual([
      { conteudo_id: conteudoId, sessoes_recentes: 3, sessoes_com_erro: 2 }
    ]);

    const comDuasSessoes = await respostaRepository.getSessoesRecentesPorConteudo(usuarioId, 2);
    expect(comDuasSessoes).toEqual([
      { conteudo_id: conteudoId, sessoes_recentes: 2, sessoes_com_erro: 1 }
    ]);
  });

  test('erros recentes por assunto ignoram questoes sem assunto', async () => {
    const semAssunto = await criarQuestao(conteudoId, { enunciado: 'C' });

    await responder(usuarioId, questaoA, false, { diasAtras: 3 });
    await responder(usuarioId, questaoA, false, { diasAtras: 2 });
    await responder(usuarioId, questaoB, true, { diasAtras: 2 });
    await responder(usuarioId, semAssunto, false, { diasAtras: 1 });

    const linhas = await respostaRepository.getErrosRecentesPorAssunto(usuarioId, 10);

    expect(linhas).toHaveLength(2);
    expect(linhas).toContainEqual({ conteudo_id: conteudoId, assunto: 'Anulacao', respostas: 2, erros: 2 });
    expect(linhas).toContainEqual({ conteudo_id: conteudoId, assunto: 'Revogacao', respostas: 1, erros: 0 });
  });

  test('evolucao diaria respeita o limite de dias', async () => {
    await responder(usuarioId, questaoA, true, { diasAtras: 1 });
    await responder(usuarioId, questaoB, false, { diasAtras: 1 });
    await responder(usuarioId, questaoA, true, { diasAtras: 40 });

    const linhas = await respostaRepository.getEvolucaoDiaria(usuarioId, 30);

    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toEqual(
      expect.objectContaining({ total_respostas: 2, total_acertos: 1 })
    );
  });

  test('recortes por materia filtram outras materias', async () => {
    const outraMateria = await criarMateria(usuarioId, 'Direito Civil');
    const outroConteudo = await criarConteudo(usuarioId, outraMateria, 'Posse');
    const questaoCivil = await criarQuestao(outroConteudo);

    await responder(usuarioId, questaoA, true, { diasAtras: 1 });
    await responder(usuarioId, questaoB, false, { diasAtras: 1 });
    await responder(usuarioId, questaoCivil, false, { diasAtras: 1 });

    expect(await respostaRepository.getResumoPorMateria(materiaId, usuarioId)).toEqual({
      total_respostas: 2,
      total_acertos: 1,
      total_erros: 1
    });

    const conteudos = await respostaRepository.getDesempenhoPorConteudoEmMateria(materiaId, usuarioId);
    expect(conteudos).toEqual([
      expect.objectContaining({ conteudo_id: conteudoId, total_respostas: 2, total_acertos: 1 })
    ]);

    const evolucao = await respostaRepository.getEvolucaoDiariaPorMateria(materiaId, usuarioId, 30);
    expect(evolucao).toEqual([expect.objectContaining({ total_respostas: 2, total_acertos: 1 })]);
  });

  test('historico por questao vem do mais recente para o mais antigo', async () => {
    await responder(usuarioId, questaoA, false, { diasAtras: 3 });
    await responder(usuarioId, questaoA, true, { diasAtras: 1 });
    await responder(usuarioId, questaoB, true, { diasAtras: 2 });

    const daQuestao = await respostaRepository.findAllByQuestaoAndUserId(questaoA.id, usuarioId);
    expect(daQuestao.map((r) => r.is_correta)).toEqual([true, false]);

    const todas = await respostaRepository.findAllByUserId(usuarioId);
    expect(todas).toHaveLength(3);
    expect(todas[0].questao_id).toBe(questaoA.id);
  });
});
