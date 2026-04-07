const pontoChaveRepository = require('../repositories/pontoChaveRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const {
  toPontoChaveResponseDto,
  toPontoChaveListResponseDto
} = require('../dtos/pontoChaveOutputDto');

async function create(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const pontoChave = await pontoChaveRepository.create(input);
  return toPontoChaveResponseDto(pontoChave);
}

async function listByConteudo(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const pontosChave = await pontoChaveRepository.findAllByConteudoId(input.conteudoId);
  return toPontoChaveListResponseDto(pontosChave);
}

module.exports = {
  create,
  listByConteudo
};
