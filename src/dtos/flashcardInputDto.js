const AppError = require('../config/appError');

function buildCreateFlashcardInputDto(body, usuarioId) {
  const { conteudo_id: conteudoId, frente, verso } = body;

  if (!conteudoId || !frente || !verso) {
    throw new AppError('conteudo_id, frente and verso are required', 400);
  }

  const parsedConteudoId = Number(conteudoId);

  if (!Number.isInteger(parsedConteudoId) || parsedConteudoId <= 0) {
    throw new AppError('valid conteudo_id is required', 400);
  }

  return {
    conteudoId: parsedConteudoId,
    frente: String(frente).trim(),
    verso: String(verso).trim(),
    usuarioId: Number(usuarioId)
  };
}

function buildFlashcardConteudoParamsDto(params) {
  const conteudoId = Number(params.conteudoId);

  if (!Number.isInteger(conteudoId) || conteudoId <= 0) {
    throw new AppError('valid conteudoId is required', 400);
  }

  return { conteudoId };
}

module.exports = {
  buildCreateFlashcardInputDto,
  buildFlashcardConteudoParamsDto
};
