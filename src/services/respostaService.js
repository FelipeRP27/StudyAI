const respostaRepository = require('../repositories/respostaRepository');
const alternativaRepository = require('../repositories/alternativaRepository');
const questaoOwnershipService = require('./questaoOwnershipService');
const AppError = require('../config/appError');
const {
  toRespostaResponseDto,
  toRespostaListResponseDto
} = require('../dtos/respostaOutputDto');

async function responder({ questaoId, alternativaId, usuarioId }) {
  await questaoOwnershipService.ensureQuestaoOwnership(questaoId, usuarioId);

  const alternativas = await alternativaRepository.findAllByQuestaoId(questaoId);

  if (alternativas.length === 0) {
    throw new AppError('Questao does not have alternativas', 400);
  }

  const escolhida = alternativas.find((alt) => alt.id === alternativaId);

  if (!escolhida) {
    throw new AppError('Alternativa does not belong to questao', 400);
  }

  const correta = alternativas.find((alt) => alt.is_correta);
  const isCorreta = Boolean(escolhida.is_correta);

  const resposta = await respostaRepository.create({
    usuarioId,
    questaoId,
    alternativaId,
    isCorreta
  });

  return toRespostaResponseDto({
    resposta,
    alternativaCorreta: correta
  });
}

async function listByQuestao({ questaoId, usuarioId }) {
  await questaoOwnershipService.ensureQuestaoOwnership(questaoId, usuarioId);

  const respostas = await respostaRepository.findAllByQuestaoAndUserId(questaoId, usuarioId);
  return toRespostaListResponseDto(respostas);
}

module.exports = {
  responder,
  listByQuestao
};
