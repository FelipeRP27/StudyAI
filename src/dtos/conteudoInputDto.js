const AppError = require('../config/appError');

const TITULO_MAX_LENGTH = 150;
const TEXTO_MIN_LENGTH = 20;
const TEXTO_MAX_LENGTH = 50000;

function buildCreateConteudoInputDto(body, usuarioId) {
  const { titulo, texto, materia_id: materiaId } = body;

  if (!titulo || !texto || !materiaId) {
    throw new AppError('titulo, texto and materia_id are required', 400);
  }

  const parsedMateriaId = Number(materiaId);

  if (!Number.isInteger(parsedMateriaId) || parsedMateriaId <= 0) {
    throw new AppError('valid materia_id is required', 400);
  }

  const tituloTrimmed = String(titulo).trim();
  const textoTrimmed = String(texto).trim();

  if (tituloTrimmed.length === 0 || tituloTrimmed.length > TITULO_MAX_LENGTH) {
    throw new AppError(`titulo must be between 1 and ${TITULO_MAX_LENGTH} characters`, 400);
  }
  if (textoTrimmed.length < TEXTO_MIN_LENGTH) {
    throw new AppError(`texto must have at least ${TEXTO_MIN_LENGTH} characters`, 400);
  }
  if (textoTrimmed.length > TEXTO_MAX_LENGTH) {
    throw new AppError(`texto must have at most ${TEXTO_MAX_LENGTH} characters`, 400);
  }

  return {
    titulo: tituloTrimmed,
    texto: textoTrimmed,
    materiaId: parsedMateriaId,
    usuarioId: Number(usuarioId)
  };
}

function buildConteudoMateriaParamsDto(params) {
  const materiaId = Number(params.materiaId);

  if (!Number.isInteger(materiaId) || materiaId <= 0) {
    throw new AppError('valid materiaId is required', 400);
  }

  return { materiaId };
}

function buildConteudoParamsDto(params) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('valid conteudo id is required', 400);
  }

  return { id };
}

module.exports = {
  buildCreateConteudoInputDto,
  buildConteudoMateriaParamsDto,
  buildConteudoParamsDto
};
