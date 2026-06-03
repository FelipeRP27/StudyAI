const db = require('../config/database');

async function create({ questaoId, texto, isCorreta, justificativa = null }) {
  const query = `
    INSERT INTO alternativas (questao_id, texto, is_correta, justificativa)
    VALUES ($1, $2, $3, $4)
    RETURNING id, questao_id, texto, is_correta, justificativa, created_at
  `;
  const result = await db.query(query, [questaoId, texto, isCorreta, justificativa]);
  return result.rows[0];
}

async function findAllByQuestaoId(questaoId) {
  const query = `
    SELECT id, questao_id, texto, is_correta, justificativa, created_at
    FROM alternativas
    WHERE questao_id = $1
    ORDER BY created_at ASC
  `;
  const result = await db.query(query, [questaoId]);
  return result.rows;
}

module.exports = {
  create,
  findAllByQuestaoId
};
