const resumoRepository = require('../repositories/resumoRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const {
  toResumoResponseDto,
  toResumoListResponseDto
} = require('../dtos/resumoOutputDto');

async function create(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const resumo = await resumoRepository.create(input);
  return toResumoResponseDto(resumo);
}

async function listByConteudo(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const resumos = await resumoRepository.findAllByConteudoId(input.conteudoId);
  return toResumoListResponseDto(resumos);
}

module.exports = {
  create,
  listByConteudo
};
