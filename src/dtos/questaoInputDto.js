const AppError = require('../config/appError');

function normalizeAlternativas(alternativas) {
  if (!Array.isArray(alternativas) || alternativas.length === 0) {
    throw new AppError('alternativas must be a non-empty array', 400);
  }

  return alternativas.map((alternativa) => {
    if (!alternativa || !alternativa.texto) {
      throw new AppError('each alternativa must contain texto', 400);
    }

    return {
      texto: String(alternativa.texto).trim(),
      is_correta: Boolean(alternativa.is_correta)
    };
  });
}

function buildCreateQuestaoInputDto(body, usuarioId) {
  const { conteudo_id: conteudoId, enunciado, alternativas } = body;

  if (!conteudoId || !enunciado) {
    throw new AppError('conteudo_id and enunciado are required', 400);
  }

  const parsedConteudoId = Number(conteudoId);

  if (!Number.isInteger(parsedConteudoId) || parsedConteudoId <= 0) {
    throw new AppError('valid conteudo_id is required', 400);
  }

  return {
    conteudoId: parsedConteudoId,
    enunciado: String(enunciado).trim(),
    alternativas: normalizeAlternativas(alternativas),
    usuarioId: Number(usuarioId)
  };
}

function buildQuestaoConteudoParamsDto(params) {
  const conteudoId = Number(params.conteudoId);

  if (!Number.isInteger(conteudoId) || conteudoId <= 0) {
    throw new AppError('valid conteudoId is required', 400);
  }

  return { conteudoId };
}

module.exports = {
  buildCreateQuestaoInputDto,
  buildQuestaoConteudoParamsDto
};
