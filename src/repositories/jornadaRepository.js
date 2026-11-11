const db = require('../config/database');

async function getEstadoDaConta(usuarioId) {
  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM materias WHERE usuario_id = $1) AS total_materias,
      (SELECT COUNT(*)::int FROM conteudos WHERE usuario_id = $1) AS total_conteudos,
      (
        SELECT COUNT(*)::int
        FROM questoes q
        INNER JOIN conteudos c ON c.id = q.conteudo_id
        WHERE c.usuario_id = $1
      ) AS total_questoes,
      (SELECT COUNT(*)::int FROM respostas_questoes WHERE usuario_id = $1) AS total_respostas,
      (
        SELECT m.id
        FROM materias m
        LEFT JOIN conteudos c ON c.materia_id = m.id
        WHERE m.usuario_id = $1
        GROUP BY m.id
        HAVING COUNT(c.id) = 0
        ORDER BY m.id ASC
        LIMIT 1
      ) AS materia_sem_conteudo_id,
      (
        SELECT c.id
        FROM conteudos c
        LEFT JOIN questoes q ON q.conteudo_id = c.id
        WHERE c.usuario_id = $1
        GROUP BY c.id
        HAVING COUNT(q.id) = 0
        ORDER BY c.id ASC
        LIMIT 1
      ) AS conteudo_sem_questoes_id,
      (
        SELECT c.id
        FROM conteudos c
        INNER JOIN questoes q ON q.conteudo_id = c.id
        WHERE c.usuario_id = $1
        GROUP BY c.id
        ORDER BY c.id ASC
        LIMIT 1
      ) AS conteudo_com_questoes_id,
      (SELECT m.id FROM materias m WHERE m.usuario_id = $1 ORDER BY m.id ASC LIMIT 1) AS primeira_materia_id
  `;
  const result = await db.query(query, [usuarioId]);
  return result.rows[0];
}

module.exports = {
  getEstadoDaConta
};
