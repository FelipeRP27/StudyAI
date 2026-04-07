const db = require('../config/database');

async function create({ nome, email, senha }) {
  const query = `
    INSERT INTO usuarios (nome, email, senha)
    VALUES ($1, $2, $3)
    RETURNING id, nome, email, senha, created_at
  `;
  const values = [nome, email, senha];
  const result = await db.query(query, values);
  return result.rows[0];
}

async function findByEmail(email) {
  const query = `
    SELECT id, nome, email, senha, created_at
    FROM usuarios
    WHERE email = $1
  `;
  const result = await db.query(query, [email]);
  return result.rows[0] || null;
}

module.exports = {
  create,
  findByEmail
};
