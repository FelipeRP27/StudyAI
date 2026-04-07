const AppError = require('../config/appError');

function buildCreateAlternativaInputDto(body, usuarioId) {
  const { questao_id: questaoId, texto, is_correta: isCorreta } = body;

  if (!questaoId || !texto) {
    throw new AppError('questao_id and texto are required', 400);
  }

  const parsedQuestaoId = Number(questaoId);

  if (!Number.isInteger(parsedQuestaoId) || parsedQuestaoId <= 0) {
    throw new AppError('valid questao_id is required', 400);
  }

  return {
    questaoId: parsedQuestaoId,
    texto: String(texto).trim(),
    isCorreta: Boolean(isCorreta),
    usuarioId: Number(usuarioId)
  };
}

function buildAlternativaQuestaoParamsDto(params) {
  const questaoId = Number(params.questaoId);

  if (!Number.isInteger(questaoId) || questaoId <= 0) {
    throw new AppError('valid questaoId is required', 400);
  }

  return { questaoId };
}

module.exports = {
  buildCreateAlternativaInputDto,
  buildAlternativaQuestaoParamsDto
};
