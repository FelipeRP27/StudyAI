const AppError = require('../config/appError');

function buildCreateResumoInputDto(body, usuarioId) {
  const { conteudo_id: conteudoId, texto } = body;

  if (!conteudoId || !texto) {
    throw new AppError('conteudo_id and texto are required', 400);
  }

  const parsedConteudoId = Number(conteudoId);

  if (!Number.isInteger(parsedConteudoId) || parsedConteudoId <= 0) {
    throw new AppError('valid conteudo_id is required', 400);
  }

  return {
    conteudoId: parsedConteudoId,
    texto: String(texto).trim(),
    usuarioId: Number(usuarioId)
  };
}

function buildResumoConteudoParamsDto(params) {
  const conteudoId = Number(params.conteudoId);

  if (!Number.isInteger(conteudoId) || conteudoId <= 0) {
    throw new AppError('valid conteudoId is required', 400);
  }

  return { conteudoId };
}

module.exports = {
  buildCreateResumoInputDto,
  buildResumoConteudoParamsDto
};
