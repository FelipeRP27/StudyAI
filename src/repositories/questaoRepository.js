const db = require('../config/database');

async function create({ conteudoId, enunciado, assunto = null }) {
  const query = `
    INSERT INTO questoes (conteudo_id, enunciado, assunto)
    VALUES ($1, $2, $3)
    RETURNING id, conteudo_id, enunciado, assunto, created_at
  `;
  const result = await db.query(query, [conteudoId, enunciado, assunto]);
  return result.rows[0];
}

async function createAlternativa({ questaoId, texto, isCorreta, justificativa = null }) {
  const query = `
    INSERT INTO alternativas (questao_id, texto, is_correta, justificativa)
    VALUES ($1, $2, $3, $4)
    RETURNING id, questao_id, texto, is_correta, justificativa, created_at
  `;
  const result = await db.query(query, [questaoId, texto, isCorreta, justificativa]);
  return result.rows[0];
}

async function findAllByConteudoId(conteudoId) {
  const query = `
    SELECT id, conteudo_id, enunciado, assunto, created_at
    FROM questoes
    WHERE conteudo_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [conteudoId]);
  return result.rows;
}

async function findAlternativasByQuestaoIds(questaoIds) {
  if (questaoIds.length === 0) {
    return [];
  }

  const query = `
    SELECT id, questao_id, texto, is_correta, justificativa, created_at
    FROM alternativas
    WHERE questao_id = ANY($1::int[])
    ORDER BY created_at ASC, id ASC
  `;
  const result = await db.query(query, [questaoIds]);
  return result.rows;
}

async function findByIdAndUserId(id, usuarioId) {
  const query = `
    SELECT q.id, q.conteudo_id, q.enunciado, q.assunto, q.created_at
    FROM questoes q
    INNER JOIN conteudos c ON c.id = q.conteudo_id
    WHERE q.id = $1 AND c.usuario_id = $2
  `;
  const result = await db.query(query, [id, usuarioId]);
  return result.rows[0] || null;
}

async function findConteudosComQuestoesSemAssunto() {
  const query = `
    SELECT DISTINCT c.id, c.titulo, c.texto
    FROM conteudos c
    INNER JOIN questoes q ON q.conteudo_id = c.id
    WHERE q.assunto IS NULL
    ORDER BY c.id ASC
  `;
  const result = await db.query(query);
  return result.rows;
}

async function findSemAssuntoByConteudoId(conteudoId) {
  const query = `
    SELECT id, enunciado
    FROM questoes
    WHERE conteudo_id = $1 AND assunto IS NULL
    ORDER BY id ASC
  `;
  const result = await db.query(query, [conteudoId]);
  return result.rows;
}

async function updateAssunto({ id, assunto }) {
  const query = `
    UPDATE questoes
    SET assunto = $2
    WHERE id = $1
  `;
  await db.query(query, [id, assunto]);
}

module.exports = {
  create,
  createAlternativa,
  findAllByConteudoId,
  findAlternativasByQuestaoIds,
  findByIdAndUserId,
  findConteudosComQuestoesSemAssunto,
  findSemAssuntoByConteudoId,
  updateAssunto
};
