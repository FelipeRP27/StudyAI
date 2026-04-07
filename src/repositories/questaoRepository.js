const db = require('../config/database');

async function create({ conteudoId, enunciado }) {
  const query = `
    INSERT INTO questoes (conteudo_id, enunciado)
    VALUES ($1, $2)
    RETURNING id, conteudo_id, enunciado, created_at
  `;
  const result = await db.query(query, [conteudoId, enunciado]);
  return result.rows[0];
}

async function createAlternativa({ questaoId, texto, isCorreta }) {
  const query = `
    INSERT INTO alternativas (questao_id, texto, is_correta)
    VALUES ($1, $2, $3)
    RETURNING id, questao_id, texto, is_correta, created_at
  `;
  const result = await db.query(query, [questaoId, texto, isCorreta]);
  return result.rows[0];
}

async function findAllByConteudoId(conteudoId) {
  const query = `
    SELECT id, conteudo_id, enunciado, created_at
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
    SELECT id, questao_id, texto, is_correta, created_at
    FROM alternativas
    WHERE questao_id = ANY($1::int[])
    ORDER BY created_at ASC
  `;
  const result = await db.query(query, [questaoIds]);
  return result.rows;
}

async function findByIdAndUserId(id, usuarioId) {
  const query = `
    SELECT q.id, q.conteudo_id, q.enunciado, q.created_at
    FROM questoes q
    INNER JOIN conteudos c ON c.id = q.conteudo_id
    WHERE q.id = $1 AND c.usuario_id = $2
  `;
  const result = await db.query(query, [id, usuarioId]);
  return result.rows[0] || null;
}

module.exports = {
  create,
  createAlternativa,
  findAllByConteudoId,
  findAlternativasByQuestaoIds,
  findByIdAndUserId
};
