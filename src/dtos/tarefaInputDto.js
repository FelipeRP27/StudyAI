const AppError = require('../config/appError');

const STATUS_VALIDOS = ['pendente', 'concluida'];
const TITULO_MAX_LENGTH = 150;
const DESCRICAO_MAX_LENGTH = 500;

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

function normalizarTituloDescricao({ titulo, descricao }) {
  const tituloTrimmed = titulo ? String(titulo).trim() : '';
  if (tituloTrimmed.length === 0 || tituloTrimmed.length > TITULO_MAX_LENGTH) {
    throw new AppError(`titulo must be between 1 and ${TITULO_MAX_LENGTH} characters`, 400);
  }
  const descricaoTrimmed = descricao ? String(descricao).trim() : null;
  if (descricaoTrimmed && descricaoTrimmed.length > DESCRICAO_MAX_LENGTH) {
    throw new AppError(`descricao must have at most ${DESCRICAO_MAX_LENGTH} characters`, 400);
  }
  return { titulo: tituloTrimmed, descricao: descricaoTrimmed };
}

function buildCreateTarefaInputDto(body, usuarioId) {
  const { data_limite: dataLimite, materia_id: materiaId } = body;
  const { titulo, descricao } = normalizarTituloDescricao(body);

  return {
    usuarioId: Number(usuarioId),
    titulo,
    descricao,
    dataLimite: parseDataLimite(dataLimite),
    materiaId: parseMateriaId(materiaId)
  };
}

function buildUpdateTarefaInputDto(body, usuarioId, id) {
  const { data_limite: dataLimite, materia_id: materiaId } = body;
  const { titulo, descricao } = normalizarTituloDescricao(body);

  return {
    id: Number(id),
    usuarioId: Number(usuarioId),
    titulo,
    descricao,
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
