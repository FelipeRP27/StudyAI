const db = require('../config/database');

async function findByHash(hash) {
  const query = `
    SELECT hash, modelo, payload, created_at
    FROM ia_cache
    WHERE hash = $1
  `;
  const result = await db.query(query, [hash]);
  return result.rows[0] || null;
}

async function upsert({ hash, modelo, payload }) {
  const query = `
    INSERT INTO ia_cache (hash, modelo, payload)
    VALUES ($1, $2, $3::jsonb)
    ON CONFLICT (hash) DO UPDATE
      SET payload = EXCLUDED.payload,
          modelo = EXCLUDED.modelo,
          created_at = CURRENT_TIMESTAMP
    RETURNING hash, modelo, payload, created_at
  `;
  const result = await db.query(query, [hash, modelo, JSON.stringify(payload)]);
  return result.rows[0];
}

module.exports = {
  findByHash,
  upsert
};
