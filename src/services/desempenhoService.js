const respostaRepository = require('../repositories/respostaRepository');
const materiaRepository = require('../repositories/materiaRepository');
const AppError = require('../config/appError');
const {
  toDesempenhoResponseDto,
  toDesempenhoMateriaResponseDto
} = require('../dtos/desempenhoOutputDto');

async function getDesempenho({ usuarioId, dias = 30 }) {
  const [resumo, porMateria, evolucao] = await Promise.all([
    respostaRepository.getDesempenhoResumo(usuarioId),
    respostaRepository.getDesempenhoPorMateria(usuarioId),
    respostaRepository.getEvolucaoDiaria(usuarioId, dias)
  ]);

  return toDesempenhoResponseDto({ resumo, porMateria, evolucao });
}

async function getDesempenhoPorMateria({ materiaId, usuarioId, dias = 30 }) {
  const materia = await materiaRepository.findByIdAndUserId(materiaId, usuarioId);

  if (!materia) {
    throw new AppError('Materia not found', 404);
  }

  const [resumo, porConteudo, evolucao] = await Promise.all([
    respostaRepository.getResumoPorMateria(materiaId, usuarioId),
    respostaRepository.getDesempenhoPorConteudoEmMateria(materiaId, usuarioId),
    respostaRepository.getEvolucaoDiariaPorMateria(materiaId, usuarioId, dias)
  ]);

  return toDesempenhoMateriaResponseDto({ materia, resumo, porConteudo, evolucao });
}

module.exports = {
  getDesempenho,
  getDesempenhoPorMateria
};
