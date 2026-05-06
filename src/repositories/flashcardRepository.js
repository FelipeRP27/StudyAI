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

async function findAllByConteudoId(conteudoId, usuarioId) {
  const query = `
    SELECT
      f.id,
      f.conteudo_id,
      f.frente,
      f.verso,
      f.created_at,
      r.revisado_em
    FROM flashcards f
    LEFT JOIN flashcards_revisados r
      ON r.flashcard_id = f.id AND r.usuario_id = $2
    WHERE f.conteudo_id = $1
    ORDER BY f.created_at DESC
  `;
  const result = await db.query(query, [conteudoId, usuarioId]);
  return result.rows;
}

async function findByIdAndUserId(id, usuarioId) {
  const query = `
    SELECT f.id, f.conteudo_id, f.frente, f.verso, f.created_at
    FROM flashcards f
    INNER JOIN conteudos c ON c.id = f.conteudo_id
    WHERE f.id = $1 AND c.usuario_id = $2
  `;
  const result = await db.query(query, [id, usuarioId]);
  return result.rows[0] || null;
}

async function marcarRevisado({ flashcardId, usuarioId }) {
  const query = `
    INSERT INTO flashcards_revisados (usuario_id, flashcard_id)
    VALUES ($1, $2)
    ON CONFLICT (usuario_id, flashcard_id)
    DO UPDATE SET revisado_em = CURRENT_TIMESTAMP
    RETURNING id, usuario_id, flashcard_id, revisado_em
  `;
  const result = await db.query(query, [usuarioId, flashcardId]);
  return result.rows[0];
}

async function desmarcarRevisado({ flashcardId, usuarioId }) {
  const query = `
    DELETE FROM flashcards_revisados
    WHERE flashcard_id = $1 AND usuario_id = $2
  `;
  await db.query(query, [flashcardId, usuarioId]);
}

module.exports = {
  create,
  findAllByConteudoId,
  findByIdAndUserId,
  marcarRevisado,
  desmarcarRevisado
};
