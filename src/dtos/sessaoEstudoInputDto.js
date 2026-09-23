const AppError = require('../config/appError');

const QUANTIDADE_MINIMA = 1;
const QUANTIDADE_MAXIMA = 20;

function parseQuantidade(valor, padrao) {
  if (valor === undefined || valor === null || valor === '') return padrao;

  const quantidade = Number(valor);

  if (!Number.isInteger(quantidade) || quantidade < QUANTIDADE_MINIMA || quantidade > QUANTIDADE_MAXIMA) {
    throw new AppError(
      `quantidade must be an integer between ${QUANTIDADE_MINIMA} and ${QUANTIDADE_MAXIMA}`,
      400
    );
  }

  return quantidade;
}

function buildSessaoInputDto(query, usuarioId, padraoQuantidade) {
  const conteudoId = Number(query.conteudo_id);

  if (!Number.isInteger(conteudoId) || conteudoId <= 0) {
    throw new AppError('valid conteudo_id is required', 400);
  }

  return {
    usuarioId: Number(usuarioId),
    conteudoId,
    quantidade: parseQuantidade(query.quantidade, padraoQuantidade)
  };
}

function buildDiagnosticoInputDto(query, usuarioId, padraoQuantidade) {
  return {
    usuarioId: Number(usuarioId),
    quantidade: parseQuantidade(query.quantidade, padraoQuantidade)
  };
}

module.exports = {
  QUANTIDADE_MINIMA,
  QUANTIDADE_MAXIMA,
  buildSessaoInputDto,
  buildDiagnosticoInputDto
};
