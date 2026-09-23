const db = require('../config/database');

async function registrar({ usuarioId, conteudoId, tipo, minutosEntreRegistros }) {
  const query = `
    INSERT INTO atividades_estudo (usuario_id, conteudo_id, tipo)
    SELECT $1::int, $2::int, $3::varchar
    WHERE NOT EXISTS (
      SELECT 1
      FROM atividades_estudo
      WHERE usuario_id = $1::int
        AND conteudo_id = $2::int
        AND tipo = $3::varchar
        AND created_at >= NOW() - ($4::int || ' minutes')::interval
    )
    RETURNING id, usuario_id, conteudo_id, tipo, created_at
  `;
  const result = await db.query(query, [usuarioId, conteudoId, tipo, minutosEntreRegistros]);
  return result.rows[0] || null;
}

async function findUltimaPorConteudo(usuarioId) {
  const query = `
    SELECT
      conteudo_id,
      MAX(created_at) AS ultima_atividade_em,
      COUNT(*)::int AS total_atividades
    FROM atividades_estudo
    WHERE usuario_id = $1
    GROUP BY conteudo_id
  `;
  const result = await db.query(query, [usuarioId]);
  return result.rows;
}

async function findUltimaDoConteudo({ usuarioId, conteudoId }) {
  const query = `
    SELECT id, usuario_id, conteudo_id, tipo, created_at
    FROM atividades_estudo
    WHERE usuario_id = $1 AND conteudo_id = $2
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `;
  const result = await db.query(query, [usuarioId, conteudoId]);
  return result.rows[0] || null;
}

module.exports = {
  registrar,
  findUltimaPorConteudo,
  findUltimaDoConteudo
};
