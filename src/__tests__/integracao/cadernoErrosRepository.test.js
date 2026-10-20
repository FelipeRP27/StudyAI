const db = require('../../config/database');
const cadernoErrosRepository = require('../../repositories/cadernoErrosRepository');
const {
  limparBanco,
  criarUsuario,
  criarMateria,
  criarConteudo,
  criarQuestao,
  responder
} = require('./fixtures');

describe('cadernoErrosRepository (banco real)', () => {
  let usuarioId;
  let materiaId;
  let conteudoId;
  let pendente;
  let revisada;
  let semErro;

  beforeEach(async () => {
    await limparBanco();
    usuarioId = await criarUsuario();
    materiaId = await criarMateria(usuarioId);
    conteudoId = await criarConteudo(usuarioId, materiaId);

    pendente = await criarQuestao(conteudoId, { enunciado: 'Pendente', assunto: 'Anulacao' });
    revisada = await criarQuestao(conteudoId, { enunciado: 'Revisada', assunto: 'Motivacao' });
    semErro = await criarQuestao(conteudoId, { enunciado: 'Sempre certa', assunto: 'Motivacao' });

    // pendente: errou duas vezes, a ultima resposta foi errada
    await responder(usuarioId, pendente, false, { diasAtras: 5 });
    await responder(usuarioId, pendente, true, { diasAtras: 4 });
    await responder(usuarioId, pendente, false, { diasAtras: 1 });

    // revisada: errou e depois acertou
    await responder(usuarioId, revisada, false, { diasAtras: 3 });
    await responder(usuarioId, revisada, true, { diasAtras: 2 });

    // sem erro: nunca entra no caderno
    await responder(usuarioId, semErro, true, { diasAtras: 1 });
  });

  afterAll(async () => {
    await db.pool.end();
  });

  test('lista so questoes com erro, com status derivado da ultima resposta', async () => {
    const linhas = await cadernoErrosRepository.findErrosByUsuario({ usuarioId });

    expect(linhas.map((l) => l.enunciado)).toEqual(['Pendente', 'Revisada']);
    expect(linhas[0]).toEqual(
      expect.objectContaining({
        total_respostas: 3,
        total_erros: 2,
        ultima_resposta_correta: false,
        assunto: 'Anulacao'
      })
    );
    expect(linhas[1].ultima_resposta_correta).toBe(true);
  });

  test('ordena pendentes antes das revisadas e por quantidade de erros', async () => {
    const outra = await criarQuestao(conteudoId, { enunciado: 'Outra pendente' });
    await responder(usuarioId, outra, false, { diasAtras: 6 });
    await responder(usuarioId, outra, false, { diasAtras: 5 });
    await responder(usuarioId, outra, false, { diasAtras: 4 });

    const linhas = await cadernoErrosRepository.findErrosByUsuario({ usuarioId });

    expect(linhas.map((l) => l.enunciado)).toEqual(['Outra pendente', 'Pendente', 'Revisada']);
  });

  test('filtra por materia e por conteudo', async () => {
    const outraMateria = await criarMateria(usuarioId, 'Direito Civil');
    const outroConteudo = await criarConteudo(usuarioId, outraMateria, 'Posse');
    const questaoCivil = await criarQuestao(outroConteudo, { enunciado: 'Civil' });
    await responder(usuarioId, questaoCivil, false, { diasAtras: 1 });

    const porMateria = await cadernoErrosRepository.findErrosByUsuario({
      usuarioId,
      materiaId: outraMateria
    });
    const porConteudo = await cadernoErrosRepository.findErrosByUsuario({
      usuarioId,
      conteudoId
    });

    expect(porMateria.map((l) => l.enunciado)).toEqual(['Civil']);
    expect(porConteudo.map((l) => l.enunciado)).toEqual(['Pendente', 'Revisada']);
  });

  test('isola o historico de cada usuario', async () => {
    const outroUsuario = await criarUsuario('Outro');
    expect(await cadernoErrosRepository.findErrosByUsuario({ usuarioId: outroUsuario })).toEqual([]);
  });

  test('resume erros por conteudo com recorrencia e pendencias', async () => {
    const [resumo] = await cadernoErrosRepository.getResumoErrosPorConteudo(usuarioId, 2);

    expect(resumo).toEqual({
      conteudo_id: conteudoId,
      questoes_com_erro: 2,
      questoes_erro_recorrente: 1,
      questoes_pendentes: 1
    });
  });
});
