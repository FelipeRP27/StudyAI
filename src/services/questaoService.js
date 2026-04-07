const questaoRepository = require('../repositories/questaoRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const {
  toQuestaoResponseDto,
  toQuestaoListResponseDto
} = require('../dtos/questaoOutputDto');

async function attachAlternativas(questoes) {
  const questaoIds = questoes.map((questao) => questao.id);
  const alternativas = await questaoRepository.findAlternativasByQuestaoIds(questaoIds);

  return questoes.map((questao) => ({
    ...questao,
    alternativas: alternativas.filter((alternativa) => alternativa.questao_id === questao.id)
  }));
}

async function create(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);

  const questao = await questaoRepository.create(input);
  const alternativas = [];

  for (const alternativa of input.alternativas) {
    const createdAlternativa = await questaoRepository.createAlternativa({
      questaoId: questao.id,
      texto: alternativa.texto,
      isCorreta: alternativa.is_correta
    });
    alternativas.push(createdAlternativa);
  }

  return toQuestaoResponseDto({
    ...questao,
    alternativas
  });
}

async function listByConteudo(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);

  const questoes = await questaoRepository.findAllByConteudoId(input.conteudoId);
  const enrichedQuestoes = await attachAlternativas(questoes);

  return toQuestaoListResponseDto(enrichedQuestoes);
}

module.exports = {
  create,
  listByConteudo
};
