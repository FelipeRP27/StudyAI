const db = require('../config/database');

const SELECT_FIELDS = `
  t.id, t.usuario_id, t.materia_id, t.titulo, t.descricao,
  t.data_limite, t.status, t.created_at, t.concluida_em,
  m.nome AS materia_nome
`;

async function create({ usuarioId, materiaId, titulo, descricao, dataLimite }) {
  const query = `
    INSERT INTO tarefas (usuario_id, materia_id, titulo, descricao, data_limite)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, usuario_id, materia_id, titulo, descricao, data_limite, status, created_at, concluida_em
  `;
  const values = [usuarioId, materiaId, titulo, descricao, dataLimite];
  const result = await db.query(query, values);
  return result.rows[0];
}

async function findAllByUserId(usuarioId) {
  const query = `
    SELECT ${SELECT_FIELDS}
    FROM tarefas t
    LEFT JOIN materias m ON m.id = t.materia_id
    WHERE t.usuario_id = $1
    ORDER BY
      CASE WHEN t.status = 'pendente' THEN 0 ELSE 1 END,
      t.data_limite ASC,
      t.created_at DESC
  `;
  const result = await db.query(query, [usuarioId]);
  return result.rows;
}

async function findByIdAndUserId(id, usuarioId) {
  const query = `
    SELECT ${SELECT_FIELDS}
    FROM tarefas t
    LEFT JOIN materias m ON m.id = t.materia_id
    WHERE t.id = $1 AND t.usuario_id = $2
  `;
  const result = await db.query(query, [id, usuarioId]);
  return result.rows[0] || null;
}

async function update({ id, usuarioId, materiaId, titulo, descricao, dataLimite }) {
  const query = `
    UPDATE tarefas
    SET materia_id = $1, titulo = $2, descricao = $3, data_limite = $4
    WHERE id = $5 AND usuario_id = $6
    RETURNING id, usuario_id, materia_id, titulo, descricao, data_limite, status, created_at, concluida_em
  `;
  const values = [materiaId, titulo, descricao, dataLimite, id, usuarioId];
  const result = await db.query(query, values);
  return result.rows[0];
}

async function setStatus({ id, usuarioId, status }) {
  const concluidaEm = status === 'concluida' ? 'CURRENT_TIMESTAMP' : 'NULL';
  const query = `
    UPDATE tarefas
    SET status = $1, concluida_em = ${concluidaEm}
    WHERE id = $2 AND usuario_id = $3
    RETURNING id, usuario_id, materia_id, titulo, descricao, data_limite, status, created_at, concluida_em
  `;
  const result = await db.query(query, [status, id, usuarioId]);
  return result.rows[0];
}

async function remove(id, usuarioId) {
  const query = `
    DELETE FROM tarefas
    WHERE id = $1 AND usuario_id = $2
  `;
  await db.query(query, [id, usuarioId]);
}

module.exports = {
  create,
  findAllByUserId,
  findByIdAndUserId,
  update,
  setStatus,
  remove
};
