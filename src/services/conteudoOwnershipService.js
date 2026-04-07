const conteudoRepository = require('../repositories/conteudoRepository');
const AppError = require('../config/appError');

async function ensureConteudoOwnership(conteudoId, usuarioId) {
  const conteudo = await conteudoRepository.findByIdAndUserId(conteudoId, usuarioId);

  if (!conteudo) {
    throw new AppError('Conteudo not found', 404);
  }

  return conteudo;
}

module.exports = {
  ensureConteudoOwnership
};
