const materiaRepository = require('../repositories/materiaRepository');
const AppError = require('../config/appError');

async function ensureMateriaOwnership(materiaId, usuarioId) {
  const materia = await materiaRepository.findByIdAndUserId(materiaId, usuarioId);

  if (!materia) {
    throw new AppError('Materia not found', 404);
  }

  return materia;
}

module.exports = {
  ensureMateriaOwnership
};
