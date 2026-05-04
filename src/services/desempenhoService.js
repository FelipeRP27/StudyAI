const respostaRepository = require('../repositories/respostaRepository');
const { toDesempenhoResponseDto } = require('../dtos/desempenhoOutputDto');

async function getDesempenho({ usuarioId, dias = 30 }) {
  const [resumo, porMateria, evolucao] = await Promise.all([
    respostaRepository.getDesempenhoResumo(usuarioId),
    respostaRepository.getDesempenhoPorMateria(usuarioId),
    respostaRepository.getEvolucaoDiaria(usuarioId, dias)
  ]);

  return toDesempenhoResponseDto({ resumo, porMateria, evolucao });
}

module.exports = {
  getDesempenho
};
