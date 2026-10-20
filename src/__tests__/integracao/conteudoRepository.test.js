const db = require('../../config/database');
const conteudoRepository = require('../../repositories/conteudoRepository');
const {
  limparBanco,
  criarUsuario,
  criarMateria,
  criarConteudo,
  criarQuestao,
  responder
} = require('./fixtures');

async function contar(tabela, coluna, valor) {
  const { rows } = await db.query(`SELECT COUNT(*)::int AS total FROM ${tabela} WHERE ${coluna} = $1`, [
    valor
  ]);
  return rows[0].total;
}

describe('conteudoRepository (banco real)', () => {
  let usuarioId;
  let materiaId;

  beforeEach(async () => {
    await limparBanco();
    usuarioId = await criarUsuario();
    materiaId = await criarMateria(usuarioId);
  });

  afterAll(async () => {
    await db.pool.end();
  });

  test('lista conteudos da materia do mais novo para o mais antigo', async () => {
    const antigo = await conteudoRepository.create({
      titulo: 'Antigo',
      texto: 'texto do conteudo antigo usado no teste',
      materiaId,
      usuarioId
    });
    await db.query(`UPDATE conteudos SET created_at = NOW() - INTERVAL '2 days' WHERE id = $1`, [
      antigo.id
    ]);
    await conteudoRepository.create({
      titulo: 'Novo',
      texto: 'texto do conteudo novo usado no teste',
      materiaId,
      usuarioId
    });

    const lista = await conteudoRepository.findAllByMateriaIdAndUserId(materiaId, usuarioId);

    expect(lista.map((c) => c.titulo)).toEqual(['Novo', 'Antigo']);
  });

  test('busca por id so devolve conteudo do dono', async () => {
    const conteudoId = await criarConteudo(usuarioId, materiaId);
    const outroUsuario = await criarUsuario('Outro');

    expect(await conteudoRepository.findByIdAndUserId(conteudoId, usuarioId)).toEqual(
      expect.objectContaining({ id: conteudoId, materia_id: materiaId })
    );
    expect(await conteudoRepository.findByIdAndUserId(conteudoId, outroUsuario)).toBeNull();
  });

  test('atualiza titulo e texto preservando materia e data de criacao', async () => {
    const criado = await conteudoRepository.create({
      titulo: 'Titulo original',
      texto: 'texto original do conteudo usado no teste',
      materiaId,
      usuarioId
    });

    const atualizado = await conteudoRepository.update({
      id: criado.id,
      usuarioId,
      titulo: 'Titulo revisado',
      texto: 'texto revisado do conteudo usado no teste'
    });

    expect(atualizado).toEqual(
      expect.objectContaining({
        id: criado.id,
        titulo: 'Titulo revisado',
        texto: 'texto revisado do conteudo usado no teste',
        materia_id: materiaId
      })
    );
    expect(new Date(atualizado.created_at)).toEqual(new Date(criado.created_at));
  });

  test('atualizacao de outro usuario nao altera nada', async () => {
    const conteudoId = await criarConteudo(usuarioId, materiaId, 'Intocado');
    const outroUsuario = await criarUsuario('Outro');

    const resultado = await conteudoRepository.update({
      id: conteudoId,
      usuarioId: outroUsuario,
      titulo: 'Invadido',
      texto: 'texto que nao deveria ser gravado neste conteudo'
    });

    expect(resultado).toBeUndefined();
    expect((await conteudoRepository.findByIdAndUserId(conteudoId, usuarioId)).titulo).toBe('Intocado');
  });

  test('exclusao remove em cascata questoes, alternativas e respostas', async () => {
    const conteudoId = await criarConteudo(usuarioId, materiaId);
    const questao = await criarQuestao(conteudoId, { enunciado: 'Sera removida' });
    await responder(usuarioId, questao, false, { diasAtras: 1 });
    await db.query(`INSERT INTO resumos (conteudo_id, texto) VALUES ($1, 'resumo gerado')`, [conteudoId]);
    await db.query(`INSERT INTO pontos_chave (conteudo_id, texto) VALUES ($1, 'ponto gerado')`, [
      conteudoId
    ]);
    await db.query(
      `INSERT INTO flashcards (conteudo_id, frente, verso) VALUES ($1, 'frente', 'verso')`,
      [conteudoId]
    );
    await db.query(
      `INSERT INTO atividades_estudo (usuario_id, conteudo_id, tipo) VALUES ($1, $2, 'resumo')`,
      [usuarioId, conteudoId]
    );

    await conteudoRepository.remove(conteudoId, usuarioId);

    expect(await conteudoRepository.findByIdAndUserId(conteudoId, usuarioId)).toBeNull();
    expect(await contar('questoes', 'conteudo_id', conteudoId)).toBe(0);
    expect(await contar('resumos', 'conteudo_id', conteudoId)).toBe(0);
    expect(await contar('pontos_chave', 'conteudo_id', conteudoId)).toBe(0);
    expect(await contar('flashcards', 'conteudo_id', conteudoId)).toBe(0);
    expect(await contar('atividades_estudo', 'conteudo_id', conteudoId)).toBe(0);
    expect(await contar('alternativas', 'questao_id', questao.id)).toBe(0);
    expect(await contar('respostas_questoes', 'questao_id', questao.id)).toBe(0);
  });

  test('exclusao preserva a materia e os demais conteudos', async () => {
    const alvo = await criarConteudo(usuarioId, materiaId, 'Alvo');
    await criarConteudo(usuarioId, materiaId, 'Permanece');

    await conteudoRepository.remove(alvo, usuarioId);

    const restantes = await conteudoRepository.findAllByMateriaIdAndUserId(materiaId, usuarioId);
    expect(restantes.map((c) => c.titulo)).toEqual(['Permanece']);
    expect(await contar('materias', 'id', materiaId)).toBe(1);
  });

  test('exclusao de outro usuario nao apaga o conteudo', async () => {
    const conteudoId = await criarConteudo(usuarioId, materiaId);
    const outroUsuario = await criarUsuario('Outro');

    await conteudoRepository.remove(conteudoId, outroUsuario);

    expect(await conteudoRepository.findByIdAndUserId(conteudoId, usuarioId)).not.toBeNull();
  });
});
