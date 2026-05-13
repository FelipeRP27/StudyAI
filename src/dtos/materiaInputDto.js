const AppError = require('../config/appError');

const NOME_MAX_LENGTH = 120;
const DESCRICAO_MAX_LENGTH = 500;

function normalizarNomeDescricao({ nome, descricao }) {
  const nomeTrimmed = nome ? String(nome).trim() : '';
  if (nomeTrimmed.length === 0 || nomeTrimmed.length > NOME_MAX_LENGTH) {
    throw new AppError(`nome must be between 1 and ${NOME_MAX_LENGTH} characters`, 400);
  }

  const descricaoTrimmed = descricao ? String(descricao).trim() : null;
  if (descricaoTrimmed && descricaoTrimmed.length > DESCRICAO_MAX_LENGTH) {
    throw new AppError(`descricao must have at most ${DESCRICAO_MAX_LENGTH} characters`, 400);
  }

  return { nome: nomeTrimmed, descricao: descricaoTrimmed };
}

function buildCreateMateriaInputDto(body, usuarioId) {
  const { nome, descricao } = normalizarNomeDescricao(body);

  return {
    usuarioId: Number(usuarioId),
    nome,
    descricao
  };
}

function buildUpdateMateriaInputDto(body, usuarioId, id) {
  const { nome, descricao } = normalizarNomeDescricao(body);

  return {
    id: Number(id),
    usuarioId: Number(usuarioId),
    nome,
    descricao
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
