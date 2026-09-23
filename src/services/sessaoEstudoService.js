const questaoRepository = require('../repositories/questaoRepository');
const materiaRepository = require('../repositories/materiaRepository');
const respostaRepository = require('../repositories/respostaRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const analiseDesempenhoService = require('./analiseDesempenhoService');
const {
  toSessaoResponseDto,
  toDiagnosticoResponseDto
} = require('../dtos/sessaoEstudoOutputDto');

const QUANTIDADE_PADRAO_SESSAO = 10;
const QUANTIDADE_PADRAO_DIAGNOSTICO = 10;

async function attachAlternativas(linhas) {
  const alternativas = await questaoRepository.findAlternativasByQuestaoIds(
    linhas.map((linha) => linha.id)
  );

  return linhas.map((linha) => ({
    ...linha,
    alternativas: alternativas.filter((alternativa) => alternativa.questao_id === linha.id)
  }));
}

async function getSessaoPorConteudo({ conteudoId, usuarioId, quantidade = QUANTIDADE_PADRAO_SESSAO }) {
  const conteudo = await conteudoOwnershipService.ensureConteudoOwnership(conteudoId, usuarioId);

  const [selecionadas, todasDoConteudo, materia] = await Promise.all([
    questaoRepository.findParaSessaoPorConteudo({ conteudoId, usuarioId, limite: quantidade }),
    questaoRepository.findAllByConteudoId(conteudoId),
    materiaRepository.findByIdAndUserId(conteudo.materia_id, usuarioId)
  ]);

  const questoes = await attachAlternativas(selecionadas);

  return toSessaoResponseDto({
    conteudo,
    materiaNome: materia?.nome ?? null,
    quantidadeSolicitada: quantidade,
    totalDisponivel: todasDoConteudo.length,
    questoes
  });
}

async function getDiagnostico({ usuarioId, quantidade = QUANTIDADE_PADRAO_DIAGNOSTICO }) {
  const [selecionadas, resumo] = await Promise.all([
    questaoRepository.findParaDiagnostico({ usuarioId, limite: quantidade }),
    respostaRepository.getDesempenhoResumo(usuarioId)
  ]);

  const questoes = await attachAlternativas(selecionadas);
  const respondidas = resumo.total_respostas || 0;
  const faltam = Math.max(0, analiseDesempenhoService.MINIMO_RESPOSTAS_GERAL - respondidas);

  const mensagem =
    questoes.length === 0
      ? 'Não encontramos questões novas para o diagnóstico. Gere questões em um conteúdo para continuar.'
      : faltam > 0
        ? `Responda estas questões para o StudyAI conhecer seu desempenho. Faltam ${faltam} respostas para o plano ser gerado.`
        : 'Responda estas questões para atualizar seu diagnóstico.';

  return toDiagnosticoResponseDto({
    quantidadeSolicitada: quantidade,
    questoes,
    mensagem,
    minimoRespostas: analiseDesempenhoService.MINIMO_RESPOSTAS_GERAL
  });
}

module.exports = {
  QUANTIDADE_PADRAO_SESSAO,
  QUANTIDADE_PADRAO_DIAGNOSTICO,
  getSessaoPorConteudo,
  getDiagnostico
};
