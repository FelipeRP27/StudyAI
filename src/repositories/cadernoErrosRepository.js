const db = require('../config/database');

const HISTORICO_POR_QUESTAO = `
  WITH respostas_ordenadas AS (
    SELECT
      r.questao_id,
      r.is_correta,
      r.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY r.questao_id
        ORDER BY r.created_at DESC, r.id DESC
      ) AS posicao
    FROM respostas_questoes r
    WHERE r.usuario_id = $1
  ),
  historico AS (
    SELECT
      questao_id,
      COUNT(*)::int AS total_respostas,
      COUNT(*) FILTER (WHERE NOT is_correta)::int AS total_erros,
      MAX(created_at) FILTER (WHERE NOT is_correta) AS ultimo_erro_em,
      MAX(created_at) AS ultima_resposta_em,
      BOOL_OR(is_correta) FILTER (WHERE posicao = 1) AS ultima_resposta_correta
    FROM respostas_ordenadas
    GROUP BY questao_id
  )
`;

async function findErrosByUsuario({ usuarioId, materiaId = null, conteudoId = null }) {
  const query = `
    ${HISTORICO_POR_QUESTAO}
    SELECT
      q.id AS questao_id,
      q.enunciado,
      q.assunto,
      q.created_at AS questao_criada_em,
      c.id AS conteudo_id,
      c.titulo AS conteudo_titulo,
      m.id AS materia_id,
      m.nome AS materia_nome,
      h.total_respostas,
      h.total_erros,
      h.ultimo_erro_em,
      h.ultima_resposta_em,
      h.ultima_resposta_correta
    FROM historico h
    INNER JOIN questoes q ON q.id = h.questao_id
    INNER JOIN conteudos c ON c.id = q.conteudo_id AND c.usuario_id = $1
    INNER JOIN materias m ON m.id = c.materia_id
    WHERE h.total_erros > 0
      AND ($2::int IS NULL OR m.id = $2)
      AND ($3::int IS NULL OR c.id = $3)
    ORDER BY
      h.ultima_resposta_correta ASC,
      h.total_erros DESC,
      h.ultimo_erro_em DESC,
      q.id ASC
  `;
  const result = await db.query(query, [usuarioId, materiaId, conteudoId]);
  return result.rows;
}

async function getResumoErrosPorConteudo(usuarioId, minimoErrosRecorrente = 2) {
  const query = `
    ${HISTORICO_POR_QUESTAO}
    SELECT
      q.conteudo_id,
      COUNT(*) FILTER (WHERE h.total_erros > 0)::int AS questoes_com_erro,
      COUNT(*) FILTER (WHERE h.total_erros >= $2)::int AS questoes_erro_recorrente,
      COUNT(*) FILTER (WHERE h.total_erros > 0 AND NOT h.ultima_resposta_correta)::int AS questoes_pendentes
    FROM historico h
    INNER JOIN questoes q ON q.id = h.questao_id
    GROUP BY q.conteudo_id
  `;
  const result = await db.query(query, [usuarioId, minimoErrosRecorrente]);
  return result.rows;
}

module.exports = {
  findErrosByUsuario,
  getResumoErrosPorConteudo
};
