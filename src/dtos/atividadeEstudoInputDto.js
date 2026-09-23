const AppError = require('../config/appError');

const TIPOS_VALIDOS = ['conteudo', 'resumo', 'pontos_chave', 'flashcards', 'questoes'];

function buildRegistrarAtividadeInputDto(body, usuarioId) {
  const conteudoId = Number(body.conteudo_id);

  if (!Number.isInteger(conteudoId) || conteudoId <= 0) {
    throw new AppError('valid conteudo_id is required', 400);
  }

  const tipo = body.tipo === undefined ? '' : String(body.tipo);

  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new AppError(`tipo must be one of: ${TIPOS_VALIDOS.join(', ')}`, 400);
  }

  return {
    usuarioId: Number(usuarioId),
    conteudoId,
    tipo
  };
}

module.exports = {
  TIPOS_VALIDOS,
  buildRegistrarAtividadeInputDto
};
