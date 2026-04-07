const db = require('../config/database');

async function create({ conteudoId, frente, verso }) {
  const query = `
    INSERT INTO flashcards (conteudo_id, frente, verso)
    VALUES ($1, $2, $3)
    RETURNING id, conteudo_id, frente, verso, created_at
  `;
  const result = await db.query(query, [conteudoId, frente, verso]);
  return result.rows[0];
}

async function findAllByConteudoId(conteudoId) {
  const query = `
    SELECT id, conteudo_id, frente, verso, created_at
    FROM flashcards
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
