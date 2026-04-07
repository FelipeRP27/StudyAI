const db = require('../config/database');

async function create({ usuarioId, nome, descricao }) {
  const query = `
    INSERT INTO materias (usuario_id, nome, descricao)
    VALUES ($1, $2, $3)
    RETURNING id, usuario_id, nome, descricao, created_at
  `;
  const values = [usuarioId, nome, descricao];
  const result = await db.query(query, values);
  return result.rows[0];
}

async function findAllByUserId(usuarioId) {
  const query = `
    SELECT id, usuario_id, nome, descricao, created_at
    FROM materias
    WHERE usuario_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [usuarioId]);
  return result.rows;
}

async function findByIdAndUserId(id, usuarioId) {
  const query = `
    SELECT id, usuario_id, nome, descricao, created_at
    FROM materias
    WHERE id = $1 AND usuario_id = $2
  `;
  const result = await db.query(query, [id, usuarioId]);
  return result.rows[0] || null;
}

async function update({ id, usuarioId, nome, descricao }) {
  const query = `
    UPDATE materias
    SET nome = $1, descricao = $2
    WHERE id = $3 AND usuario_id = $4
    RETURNING id, usuario_id, nome, descricao, created_at
  `;
  const values = [nome, descricao, id, usuarioId];
  const result = await db.query(query, values);
  return result.rows[0];
}

async function remove(id, usuarioId) {
  const query = `
    DELETE FROM materias
    WHERE id = $1 AND usuario_id = $2
  `;
  await db.query(query, [id, usuarioId]);
}

module.exports = {
  create,
  findAllByUserId,
  findByIdAndUserId,
  update,
  remove
};
