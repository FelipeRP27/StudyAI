const db = require('../config/database');

async function create({ conteudoId, texto }) {
  const query = `
    INSERT INTO pontos_chave (conteudo_id, texto)
    VALUES ($1, $2)
    RETURNING id, conteudo_id, texto, created_at
  `;
  const result = await db.query(query, [conteudoId, texto]);
  return result.rows[0];
}

async function findAllByConteudoId(conteudoId) {
  const query = `
    SELECT id, conteudo_id, texto, created_at
    FROM pontos_chave
    WHERE conteudo_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [conteudoId]);
  return result.rows;
}

module.exports = {
  create,
  findAllByConteudoId
};
