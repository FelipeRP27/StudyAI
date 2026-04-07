const alternativaRepository = require('../repositories/alternativaRepository');
const questaoOwnershipService = require('./questaoOwnershipService');
const {
  toAlternativaResponseDto,
  toAlternativaListResponseDto
} = require('../dtos/alternativaOutputDto');

async function create(input) {
  await questaoOwnershipService.ensureQuestaoOwnership(input.questaoId, input.usuarioId);
  const alternativa = await alternativaRepository.create(input);
  return toAlternativaResponseDto(alternativa);
}

async function listByQuestao(input) {
  await questaoOwnershipService.ensureQuestaoOwnership(input.questaoId, input.usuarioId);
  const alternativas = await alternativaRepository.findAllByQuestaoId(input.questaoId);
  return toAlternativaListResponseDto(alternativas);
}

module.exports = {
  create,
  listByQuestao
};
