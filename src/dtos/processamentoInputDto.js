const AppError = require('../config/appError');

const TIPOS_VALIDOS = ['resumo', 'pontos_chave', 'questoes', 'flashcards'];

function buildProcessarConteudoInputDto(body, params, usuarioId) {
  const conteudoId = Number(params.conteudoId);

  if (!Number.isInteger(conteudoId) || conteudoId <= 0) {
    throw new AppError('valid conteudoId is required', 400);
  }

  let tipos;

  if (body && body.tipos !== undefined) {
    if (!Array.isArray(body.tipos)) {
      throw new AppError('tipos deve ser um array', 400);
    }

    tipos = body.tipos.map((tipo) => String(tipo).trim());

    const invalidos = tipos.filter((tipo) => !TIPOS_VALIDOS.includes(tipo));
    if (invalidos.length > 0) {
      throw new AppError(`tipos invalidos: ${invalidos.join(', ')}`, 400);
    }
  }

  return {
    conteudoId,
    usuarioId: Number(usuarioId),
    tipos
  };
}

function buildProcessamentoConteudoParamsDto(params) {
  const conteudoId = Number(params.conteudoId);

  if (!Number.isInteger(conteudoId) || conteudoId <= 0) {
    throw new AppError('valid conteudoId is required', 400);
  }

  return { conteudoId };
}

module.exports = {
  buildProcessarConteudoInputDto,
  buildProcessamentoConteudoParamsDto,
  TIPOS_VALIDOS
};
