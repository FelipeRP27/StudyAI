const conteudoRepository = require('../repositories/conteudoRepository');
const materiaRepository = require('../repositories/materiaRepository');
const AppError = require('../config/appError');
const {
  toConteudoResponseDto,
  toConteudoListResponseDto
} = require('../dtos/conteudoOutputDto');

async function create(input) {
  const materia = await materiaRepository.findByIdAndUserId(input.materiaId, input.usuarioId);

  if (!materia) {
    throw new AppError('Materia not found', 404);
  }

  const conteudo = await conteudoRepository.create(input);
  return toConteudoResponseDto(conteudo);
}

async function listByMateria(input) {
  const materia = await materiaRepository.findByIdAndUserId(input.materiaId, input.usuarioId);

  if (!materia) {
    throw new AppError('Materia not found', 404);
  }

  const conteudos = await conteudoRepository.findAllByMateriaIdAndUserId(
    input.materiaId,
    input.usuarioId
  );

  return toConteudoListResponseDto(conteudos);
}

module.exports = {
  create,
  listByMateria
};
