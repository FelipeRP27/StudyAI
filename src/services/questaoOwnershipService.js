const questaoRepository = require('../repositories/questaoRepository');
const AppError = require('../config/appError');

async function ensureQuestaoOwnership(questaoId, usuarioId) {
  const questao = await questaoRepository.findByIdAndUserId(questaoId, usuarioId);

  if (!questao) {
    throw new AppError('Questao not found', 404);
  }

  return questao;
}

module.exports = {
  ensureQuestaoOwnership
};
