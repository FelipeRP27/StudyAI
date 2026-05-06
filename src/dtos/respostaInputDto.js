const AppError = require('../config/appError');

function buildResponderInputDto(body, usuarioId) {
  const { questao_id: questaoId, alternativa_id: alternativaId } = body;

  const parsedQuestaoId = Number(questaoId);
  const parsedAlternativaId = Number(alternativaId);

  if (!Number.isInteger(parsedQuestaoId) || parsedQuestaoId <= 0) {
    throw new AppError('valid questao_id is required', 400);
  }

  if (!Number.isInteger(parsedAlternativaId) || parsedAlternativaId <= 0) {
    throw new AppError('valid alternativa_id is required', 400);
  }

  return {
    questaoId: parsedQuestaoId,
    alternativaId: parsedAlternativaId,
    usuarioId: Number(usuarioId)
  };
}

function buildRespostaQuestaoParamsDto(params) {
  const questaoId = Number(params.questaoId);

  if (!Number.isInteger(questaoId) || questaoId <= 0) {
    throw new AppError('valid questaoId is required', 400);
  }

  return { questaoId };
}

module.exports = {
  buildResponderInputDto,
  buildRespostaQuestaoParamsDto
};
