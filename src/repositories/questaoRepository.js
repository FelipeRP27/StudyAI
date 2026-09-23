const db = require('../config/database');

async function create({ conteudoId, enunciado, assunto = null }) {
  const query = `
    INSERT INTO questoes (conteudo_id, enunciado, assunto)
    VALUES ($1, $2, $3)
    RETURNING id, conteudo_id, enunciado, assunto, created_at
  `;
  const result = await db.query(query, [conteudoId, enunciado, assunto]);
  return result.rows[0];
}

async function createAlternativa({ questaoId, texto, isCorreta, justificativa = null }) {
  const query = `
    INSERT INTO alternativas (questao_id, texto, is_correta, justificativa)
    VALUES ($1, $2, $3, $4)
    RETURNING id, questao_id, texto, is_correta, justificativa, created_at
  `;
  const result = await db.query(query, [questaoId, texto, isCorreta, justificativa]);
  return result.rows[0];
}

async function findAllByConteudoId(conteudoId) {
  const query = `
    SELECT id, conteudo_id, enunciado, assunto, created_at
    FROM questoes
    WHERE conteudo_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [conteudoId]);
  return result.rows;
}

async function findAlternativasByQuestaoIds(questaoIds) {
  if (questaoIds.length === 0) {
    return [];
  }

  const query = `
    SELECT id, questao_id, texto, is_correta, justificativa, created_at
    FROM alternativas
    WHERE questao_id = ANY($1::int[])
    ORDER BY created_at ASC, id ASC
  `;
  const result = await db.query(query, [questaoIds]);
  return result.rows;
}

async function findByIdAndUserId(id, usuarioId) {
  const query = `
    SELECT q.id, q.conteudo_id, q.enunciado, q.assunto, q.created_at
    FROM questoes q
    INNER JOIN conteudos c ON c.id = q.conteudo_id
    WHERE q.id = $1 AND c.usuario_id = $2
  `;
  const result = await db.query(query, [id, usuarioId]);
  return result.rows[0] || null;
}

async function findConteudosComQuestoesSemAssunto() {
  const query = `
    SELECT DISTINCT c.id, c.titulo, c.texto
    FROM conteudos c
    INNER JOIN questoes q ON q.conteudo_id = c.id
    WHERE q.assunto IS NULL
    ORDER BY c.id ASC
  `;
  const result = await db.query(query);
  return result.rows;
}

async function findSemAssuntoByConteudoId(conteudoId) {
  const query = `
    SELECT id, enunciado
    FROM questoes
    WHERE conteudo_id = $1 AND assunto IS NULL
    ORDER BY id ASC
  `;
  const result = await db.query(query, [conteudoId]);
  return result.rows;
}

async function updateAssunto({ id, assunto }) {
  const query = `
    UPDATE questoes
    SET assunto = $2
    WHERE id = $1
  `;
  await db.query(query, [id, assunto]);
}

const HISTORICO_DO_USUARIO = `
  WITH historico AS (
    SELECT
      r.questao_id,
      COUNT(*)::int AS total_respostas,
      COUNT(*) FILTER (WHERE NOT r.is_correta)::int AS total_erros,
      MAX(r.created_at) AS ultima_resposta_em,
      (ARRAY_AGG(r.is_correta ORDER BY r.created_at DESC, r.id DESC))[1] AS ultima_resposta_correta
    FROM respostas_questoes r
    WHERE r.usuario_id = $1
    GROUP BY r.questao_id
  )
`;

async function findParaSessaoPorConteudo({ conteudoId, usuarioId, limite }) {
  const query = `
    ${HISTORICO_DO_USUARIO}
    SELECT
      q.id,
      q.conteudo_id,
      q.enunciado,
      q.assunto,
      q.created_at,
      COALESCE(h.total_respostas, 0) AS total_respostas,
      COALESCE(h.total_erros, 0) AS total_erros,
      h.ultima_resposta_em,
      h.ultima_resposta_correta
    FROM questoes q
    LEFT JOIN historico h ON h.questao_id = q.id
    WHERE q.conteudo_id = $2
    ORDER BY
      (h.questao_id IS NULL) DESC,
      (h.ultima_resposta_correta IS FALSE) DESC,
      COALESCE(h.total_erros, 0) DESC,
      h.ultima_resposta_em ASC NULLS FIRST,
      q.id ASC
    LIMIT $3
  `;
  const result = await db.query(query, [usuarioId, conteudoId, limite]);
  return result.rows;
}

async function findParaDiagnostico({ usuarioId, limite }) {
  const query = `
    ${HISTORICO_DO_USUARIO},
    respostas_por_conteudo AS (
      SELECT q.conteudo_id, COALESCE(SUM(h.total_respostas), 0)::int AS respostas_do_conteudo
      FROM questoes q
      LEFT JOIN historico h ON h.questao_id = q.id
      GROUP BY q.conteudo_id
    ),
    candidatas AS (
      SELECT
        q.id,
        q.conteudo_id,
        q.enunciado,
        q.assunto,
        q.created_at,
        c.titulo AS conteudo_titulo,
        m.id AS materia_id,
        m.nome AS materia_nome,
        rpc.respostas_do_conteudo,
        ROW_NUMBER() OVER (
          PARTITION BY q.conteudo_id
          ORDER BY (h.questao_id IS NULL) DESC, h.ultima_resposta_em ASC NULLS FIRST, q.id ASC
        ) AS ordem_no_conteudo
      FROM questoes q
      INNER JOIN conteudos c ON c.id = q.conteudo_id AND c.usuario_id = $1
      INNER JOIN materias m ON m.id = c.materia_id
      INNER JOIN respostas_por_conteudo rpc ON rpc.conteudo_id = q.conteudo_id
      LEFT JOIN historico h ON h.questao_id = q.id
      WHERE h.questao_id IS NULL
    )
    SELECT *
    FROM candidatas
    ORDER BY ordem_no_conteudo ASC, respostas_do_conteudo ASC, materia_nome ASC, conteudo_id ASC
    LIMIT $2
  `;
  const result = await db.query(query, [usuarioId, limite]);
  return result.rows;
}

module.exports = {
  create,
  findParaSessaoPorConteudo,
  findParaDiagnostico,
  createAlternativa,
  findAllByConteudoId,
  findAlternativasByQuestaoIds,
  findByIdAndUserId,
  findConteudosComQuestoesSemAssunto,
  findSemAssuntoByConteudoId,
  updateAssunto
};
