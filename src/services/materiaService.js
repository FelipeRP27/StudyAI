const materiaRepository = require('../repositories/materiaRepository');
const AppError = require('../config/appError');
const {
  toMateriaResponseDto,
  toMateriaListResponseDto
} = require('../dtos/materiaOutputDto');

async function create(input) {
  const materia = await materiaRepository.create(input);
  return toMateriaResponseDto(materia);
}

async function listByUser(usuarioId) {
  const materias = await materiaRepository.findAllByUserId(usuarioId);
  return toMateriaListResponseDto(materias);
}

async function update(input) {
  const existingMateria = await materiaRepository.findByIdAndUserId(input.id, input.usuarioId);

  if (!existingMateria) {
    throw new AppError('Materia not found', 404);
  }

  const materia = await materiaRepository.update(input);
  return toMateriaResponseDto(materia);
}

async function remove(input) {
  const existingMateria = await materiaRepository.findByIdAndUserId(input.id, input.usuarioId);

  if (!existingMateria) {
    throw new AppError('Materia not found', 404);
  }

  await materiaRepository.remove(input.id, input.usuarioId);
}

module.exports = {
  create,
  listByUser,
  update,
  remove
};
