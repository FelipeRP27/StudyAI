const db = require('../config/database');

async function create({ usuarioId, questaoId, alternativaId, isCorreta }) {
  const query = `
    INSERT INTO respostas_questoes (usuario_id, questao_id, alternativa_id, is_correta)
    VALUES ($1, $2, $3, $4)
    RETURNING id, usuario_id, questao_id, alternativa_id, is_correta, created_at
  `;
  const values = [usuarioId, questaoId, alternativaId, isCorreta];
  const result = await db.query(query, values);
  return result.rows[0];
}

async function findAllByUserId(usuarioId) {
  const query = `
    SELECT id, usuario_id, questao_id, alternativa_id, is_correta, created_at
    FROM respostas_questoes
    WHERE usuario_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [usuarioId]);
  return result.rows;
}

async function findAllByQuestaoAndUserId(questaoId, usuarioId) {
  const query = `
    SELECT id, usuario_id, questao_id, alternativa_id, is_correta, created_at
    FROM respostas_questoes
    WHERE questao_id = $1 AND usuario_id = $2
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [questaoId, usuarioId]);
  return result.rows;
}

async function getDesempenhoResumo(usuarioId) {
  const query = `
    SELECT
      COUNT(*)::int AS total_respostas,
      COUNT(*) FILTER (WHERE is_correta)::int AS total_acertos,
      COUNT(*) FILTER (WHERE NOT is_correta)::int AS total_erros
    FROM respostas_questoes
    WHERE usuario_id = $1
  `;
  const result = await db.query(query, [usuarioId]);
  return result.rows[0];
}

async function getDesempenhoPorMateria(usuarioId) {
  const query = `
    SELECT
      m.id AS materia_id,
      m.nome AS materia_nome,
      COUNT(r.*)::int AS total_respostas,
      COUNT(r.*) FILTER (WHERE r.is_correta)::int AS total_acertos
    FROM respostas_questoes r
    INNER JOIN questoes q ON q.id = r.questao_id
    INNER JOIN conteudos c ON c.id = q.conteudo_id
    INNER JOIN materias m ON m.id = c.materia_id
    WHERE r.usuario_id = $1
    GROUP BY m.id, m.nome
    ORDER BY m.nome ASC
  `;
  const result = await db.query(query, [usuarioId]);
  return result.rows;
}

async function getEvolucaoDiaria(usuarioId, dias = 30) {
  const query = `
    SELECT
      DATE(created_at) AS dia,
      COUNT(*)::int AS total_respostas,
      COUNT(*) FILTER (WHERE is_correta)::int AS total_acertos
    FROM respostas_questoes
    WHERE usuario_id = $1
      AND created_at >= NOW() - ($2 || ' days')::interval
    GROUP BY DATE(created_at)
    ORDER BY dia ASC
  `;
  const result = await db.query(query, [usuarioId, dias]);
  return result.rows;
}

async function getResumoPorMateria(materiaId, usuarioId) {
  const query = `
    SELECT
      COUNT(r.*)::int AS total_respostas,
      COUNT(r.*) FILTER (WHERE r.is_correta)::int AS total_acertos,
      COUNT(r.*) FILTER (WHERE NOT r.is_correta)::int AS total_erros
    FROM respostas_questoes r
    INNER JOIN questoes q ON q.id = r.questao_id
    INNER JOIN conteudos c ON c.id = q.conteudo_id
    WHERE r.usuario_id = $1 AND c.materia_id = $2
  `;
  const result = await db.query(query, [usuarioId, materiaId]);
  return result.rows[0];
}

async function getDesempenhoPorConteudoEmMateria(materiaId, usuarioId) {
  const query = `
    SELECT
      c.id AS conteudo_id,
      c.titulo AS conteudo_titulo,
      COUNT(r.*)::int AS total_respostas,
      COUNT(r.*) FILTER (WHERE r.is_correta)::int AS total_acertos
    FROM respostas_questoes r
    INNER JOIN questoes q ON q.id = r.questao_id
    INNER JOIN conteudos c ON c.id = q.conteudo_id
    WHERE r.usuario_id = $1 AND c.materia_id = $2
    GROUP BY c.id, c.titulo
    ORDER BY c.titulo ASC
  `;
  const result = await db.query(query, [usuarioId, materiaId]);
  return result.rows;
}

async function getEvolucaoDiariaPorMateria(materiaId, usuarioId, dias = 30) {
  const query = `
    SELECT
      DATE(r.created_at) AS dia,
      COUNT(*)::int AS total_respostas,
      COUNT(*) FILTER (WHERE r.is_correta)::int AS total_acertos
    FROM respostas_questoes r
    INNER JOIN questoes q ON q.id = r.questao_id
    INNER JOIN conteudos c ON c.id = q.conteudo_id
    WHERE r.usuario_id = $1
      AND c.materia_id = $2
      AND r.created_at >= NOW() - ($3 || ' days')::interval
    GROUP BY DATE(r.created_at)
    ORDER BY dia ASC
  `;
  const result = await db.query(query, [usuarioId, materiaId, dias]);
  return result.rows;
}

module.exports = {
  create,
  findAllByUserId,
  findAllByQuestaoAndUserId,
  getDesempenhoResumo,
  getDesempenhoPorMateria,
  getEvolucaoDiaria,
  getResumoPorMateria,
  getDesempenhoPorConteudoEmMateria,
  getEvolucaoDiariaPorMateria
};
