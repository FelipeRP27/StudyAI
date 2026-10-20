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

async function update(input) {
  const conteudo = await conteudoRepository.findByIdAndUserId(input.id, input.usuarioId);

  if (!conteudo) {
    throw new AppError('Conteudo not found', 404);
  }

  const atualizado = await conteudoRepository.update(input);
  return toConteudoResponseDto(atualizado);
}

async function remove({ id, usuarioId }) {
  const conteudo = await conteudoRepository.findByIdAndUserId(id, usuarioId);

  if (!conteudo) {
    throw new AppError('Conteudo not found', 404);
  }

  await conteudoRepository.remove(id, usuarioId);
}

async function findById({ id, usuarioId }) {
  const conteudo = await conteudoRepository.findByIdAndUserId(id, usuarioId);

  if (!conteudo) {
    throw new AppError('Conteudo not found', 404);
  }

  return toConteudoResponseDto(conteudo);
}

module.exports = {
  create,
  update,
  remove,
  listByMateria,
  findById
};
