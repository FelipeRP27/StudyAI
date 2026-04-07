const db = require('../config/database');

async function create({ titulo, texto, materiaId, usuarioId }) {
  const query = `
    INSERT INTO conteudos (titulo, texto, materia_id, usuario_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, titulo, texto, materia_id, usuario_id, created_at
  `;
  const values = [titulo, texto, materiaId, usuarioId];
  const result = await db.query(query, values);
  return result.rows[0];
}

async function findAllByMateriaIdAndUserId(materiaId, usuarioId) {
  const query = `
    SELECT id, titulo, texto, materia_id, usuario_id, created_at
    FROM conteudos
    WHERE materia_id = $1 AND usuario_id = $2
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [materiaId, usuarioId]);
  return result.rows;
}

async function findByIdAndUserId(id, usuarioId) {
  const query = `
    SELECT id, titulo, texto, materia_id, usuario_id, created_at
    FROM conteudos
    WHERE id = $1 AND usuario_id = $2
  `;
  const result = await db.query(query, [id, usuarioId]);
  return result.rows[0] || null;
}

module.exports = {
  create,
  findAllByMateriaIdAndUserId,
  findByIdAndUserId
};
