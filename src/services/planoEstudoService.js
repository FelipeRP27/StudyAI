const respostaRepository = require('../repositories/respostaRepository');
const analiseDesempenhoService = require('./analiseDesempenhoService');
const { toPlanoEstudoResponseDto } = require('../dtos/planoEstudoOutputDto');

const RECOMENDACOES = {
  alta: 'Revise os pontos-chave e responda 10 questões deste conteúdo.',
  media: 'Revise o resumo e responda 5 questões deste conteúdo.',
  baixa: 'Mantenha o acompanhamento com uma revisão rápida.',
  sem_dados: `Responda pelo menos ${analiseDesempenhoService.MINIMO_RESPOSTAS_POR_CONTEUDO} questões para o StudyAI conhecer seu desempenho neste conteúdo.`
};

function montarJustificativa(item, taxaGeral) {
  if (item.prioridade === 'sem_dados') {
    const questoes = item.total_respostas === 1 ? 'questão' : 'questões';
    return `Você respondeu apenas ${item.total_respostas} ${questoes} deste conteúdo. Ainda não há dados suficientes para avaliar seu desempenho.`;
  }

  const partes = [
    `Você respondeu ${item.total_respostas} questões deste conteúdo e acertou ${Math.round(item.taxa_acerto)}%.`
  ];

  if (item.taxa_acerto < taxaGeral) {
    partes.push(`Sua taxa está abaixo da sua média geral de ${Math.round(taxaGeral)}%.`);
  } else {
    partes.push(`Sua taxa está em linha com a sua média geral de ${Math.round(taxaGeral)}%.`);
  }

  if (item.dias_sem_responder !== null && item.dias_sem_responder > 0) {
    const dias = item.dias_sem_responder === 1 ? 'dia' : 'dias';
    partes.push(`A última resposta foi há ${item.dias_sem_responder} ${dias}.`);
  }

  return partes.join(' ');
}

async function getPlanoEstudo({ usuarioId }) {
  const [resumo, porConteudo] = await Promise.all([
    respostaRepository.getDesempenhoResumo(usuarioId),
    respostaRepository.getDesempenhoPorConteudo(usuarioId)
  ]);

  const itensAnalisados = analiseDesempenhoService.analisarConteudos(porConteudo);
  const taxaGeral = analiseDesempenhoService.calcularTaxa(
    resumo.total_acertos || 0,
    resumo.total_respostas || 0
  );

  const itens = itensAnalisados.map((item) => ({
    ...item,
    justificativa: montarJustificativa(item, taxaGeral),
    recomendacao: RECOMENDACOES[item.prioridade]
  }));

  return toPlanoEstudoResponseDto({
    resumo,
    taxaGeral,
    itens,
    temDadosSuficientes: analiseDesempenhoService.temDadosSuficientes(itensAnalisados),
    minimoRespostas: analiseDesempenhoService.MINIMO_RESPOSTAS_GERAL
  });
}

module.exports = {
  getPlanoEstudo
};
