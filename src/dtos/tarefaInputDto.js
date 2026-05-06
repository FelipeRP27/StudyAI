const AppError = require('../config/appError');

const STATUS_VALIDOS = ['pendente', 'concluida'];

function parseDataLimite(raw) {
  if (!raw) {
    throw new AppError('data_limite is required', 400);
  }
  const data = new Date(raw);
  if (Number.isNaN(data.getTime())) {
    throw new AppError('data_limite must be a valid date (YYYY-MM-DD)', 400);
  }
  return data.toISOString().slice(0, 10);
}

function parseMateriaId(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('valid materia_id is required when provided', 400);
  }
  return id;
}

function buildCreateTarefaInputDto(body, usuarioId) {
  const { titulo, descricao, data_limite: dataLimite, materia_id: materiaId } = body;

  if (!titulo || !String(titulo).trim()) {
    throw new AppError('titulo is required', 400);
  }

  return {
    usuarioId: Number(usuarioId),
    titulo: String(titulo).trim(),
    descricao: descricao ? String(descricao).trim() : null,
    dataLimite: parseDataLimite(dataLimite),
    materiaId: parseMateriaId(materiaId)
  };
}

function buildUpdateTarefaInputDto(body, usuarioId, id) {
  const { titulo, descricao, data_limite: dataLimite, materia_id: materiaId } = body;

  if (!titulo || !String(titulo).trim()) {
    throw new AppError('titulo is required', 400);
  }

  return {
    id: Number(id),
    usuarioId: Number(usuarioId),
    titulo: String(titulo).trim(),
    descricao: descricao ? String(descricao).trim() : null,
    dataLimite: parseDataLimite(dataLimite),
    materiaId: parseMateriaId(materiaId)
  };
}

function buildTarefaParamsDto(params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('valid id is required', 400);
  }
  return { id };
}

function buildSetStatusInputDto(body) {
  const { status } = body;
  if (!STATUS_VALIDOS.includes(status)) {
    throw new AppError(`status must be one of ${STATUS_VALIDOS.join(', ')}`, 400);
  }
  return { status };
}

module.exports = {
  buildCreateTarefaInputDto,
  buildUpdateTarefaInputDto,
  buildTarefaParamsDto,
  buildSetStatusInputDto
};
