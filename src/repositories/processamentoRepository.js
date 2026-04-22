const db = require('../config/database');

async function create({ conteudoId, usuarioId, tipo }) {
  const query = `
    INSERT INTO processamentos (conteudo_id, usuario_id, tipo, status)
    VALUES ($1, $2, $3, 'processando')
    RETURNING id, conteudo_id, usuario_id, tipo, status, erro, iniciado_em, concluido_em
  `;
  const result = await db.query(query, [conteudoId, usuarioId, tipo]);
  return result.rows[0];
}

async function markConcluido(id) {
  const query = `
    UPDATE processamentos
    SET status = 'concluido', concluido_em = CURRENT_TIMESTAMP, erro = NULL
    WHERE id = $1
    RETURNING id, conteudo_id, usuario_id, tipo, status, erro, iniciado_em, concluido_em
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
}

async function markErro(id, mensagem) {
  const query = `
    UPDATE processamentos
    SET status = 'erro', concluido_em = CURRENT_TIMESTAMP, erro = $2
    WHERE id = $1
    RETURNING id, conteudo_id, usuario_id, tipo, status, erro, iniciado_em, concluido_em
  `;
  const result = await db.query(query, [id, mensagem]);
  return result.rows[0];
}

async function findAllByConteudoId(conteudoId) {
  const query = `
    SELECT id, conteudo_id, usuario_id, tipo, status, erro, iniciado_em, concluido_em
    FROM processamentos
    WHERE conteudo_id = $1
    ORDER BY iniciado_em DESC
  `;
  const result = await db.query(query, [conteudoId]);
  return result.rows;
}

module.exports = {
  create,
  markConcluido,
  markErro,
  findAllByConteudoId
};
