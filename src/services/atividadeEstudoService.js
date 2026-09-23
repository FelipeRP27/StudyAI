const atividadeEstudoRepository = require('../repositories/atividadeEstudoRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const { toAtividadeEstudoResponseDto } = require('../dtos/atividadeEstudoOutputDto');

const MINUTOS_ENTRE_REGISTROS = 30;

async function registrar({ usuarioId, conteudoId, tipo }) {
  await conteudoOwnershipService.ensureConteudoOwnership(conteudoId, usuarioId);

  const atividade = await atividadeEstudoRepository.registrar({
    usuarioId,
    conteudoId,
    tipo,
    minutosEntreRegistros: MINUTOS_ENTRE_REGISTROS
  });

  if (atividade) {
    return toAtividadeEstudoResponseDto({ atividade, registrada: true });
  }

  const ultima = await atividadeEstudoRepository.findUltimaDoConteudo({ usuarioId, conteudoId });
  return toAtividadeEstudoResponseDto({ atividade: ultima, registrada: false });
}

module.exports = {
  MINUTOS_ENTRE_REGISTROS,
  registrar
};
