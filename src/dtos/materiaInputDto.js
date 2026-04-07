const AppError = require('../config/appError');

function buildCreateMateriaInputDto(body, usuarioId) {
  const { nome, descricao } = body;

  if (!nome) {
    throw new AppError('nome is required', 400);
  }

  return {
    usuarioId: Number(usuarioId),
    nome: String(nome).trim(),
    descricao: descricao ? String(descricao).trim() : null
  };
}

function buildUpdateMateriaInputDto(body, usuarioId, id) {
  const { nome, descricao } = body;

  if (!nome) {
    throw new AppError('nome is required', 400);
  }

  return {
    id: Number(id),
    usuarioId: Number(usuarioId),
    nome: String(nome).trim(),
    descricao: descricao ? String(descricao).trim() : null
  };
}

function buildMateriaParamsDto(params) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('valid materia id is required', 400);
  }

  return { id };
}

module.exports = {
  buildCreateMateriaInputDto,
  buildUpdateMateriaInputDto,
  buildMateriaParamsDto
};
