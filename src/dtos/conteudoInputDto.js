const AppError = require('../config/appError');

function buildCreateConteudoInputDto(body, usuarioId) {
  const { titulo, texto, materia_id: materiaId } = body;

  if (!titulo || !texto || !materiaId) {
    throw new AppError('titulo, texto and materia_id are required', 400);
  }

  const parsedMateriaId = Number(materiaId);

  if (!Number.isInteger(parsedMateriaId) || parsedMateriaId <= 0) {
    throw new AppError('valid materia_id is required', 400);
  }

  return {
    titulo: String(titulo).trim(),
    texto: String(texto).trim(),
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

module.exports = {
  buildCreateConteudoInputDto,
  buildConteudoMateriaParamsDto
};
