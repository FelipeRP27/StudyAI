const AppError = require('../config/appError');

const STATUS_VALIDOS = ['pendente', 'revisado'];

function parseIdOpcional(valor, campo) {
  if (valor === undefined || valor === null || valor === '') return null;
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${campo} must be a positive integer`, 400);
  }
  return id;
}

function buildListarErrosInputDto(query, usuarioId) {
  const status = query.status === undefined || query.status === '' ? null : String(query.status);

  if (status && !STATUS_VALIDOS.includes(status)) {
    throw new AppError(`status must be one of: ${STATUS_VALIDOS.join(', ')}`, 400);
  }

  return {
    usuarioId: Number(usuarioId),
    materiaId: parseIdOpcional(query.materia_id, 'materia_id'),
    conteudoId: parseIdOpcional(query.conteudo_id, 'conteudo_id'),
    status
  };
}

module.exports = {
  STATUS_VALIDOS,
  buildListarErrosInputDto
};
