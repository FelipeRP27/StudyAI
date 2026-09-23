const respostaRepository = require('../repositories/respostaRepository');
const cadernoErrosRepository = require('../repositories/cadernoErrosRepository');
const atividadeEstudoRepository = require('../repositories/atividadeEstudoRepository');
const analiseDesempenhoService = require('./analiseDesempenhoService');
const { toPlanoEstudoResponseDto } = require('../dtos/planoEstudoOutputDto');

const DIFERENCA_ACIMA_DA_MEDIA = 5;

const RECOMENDACOES = {
  alta: 'Revise os pontos-chave e responda 10 questões deste conteúdo.',
  media: 'Revise o resumo e responda 5 questões deste conteúdo.',
  revisao_por_tempo: 'Faça uma revisão rápida do resumo e responda 5 questões para manter este conteúdo em dia.',
  baixa: 'Mantenha o acompanhamento com uma revisão rápida.',
  sem_dados: `Responda pelo menos ${analiseDesempenhoService.MINIMO_RESPOSTAS_POR_CONTEUDO} questões para o StudyAI conhecer seu desempenho neste conteúdo.`
};

function plural(quantidade, singular, pluralTexto) {
  return quantidade === 1 ? singular : pluralTexto;
}

function formatarAssuntoNaFrase(assunto) {
  const segundaLetra = assunto.charAt(1);
  if (segundaLetra && segundaLetra === segundaLetra.toUpperCase()) return assunto;
  return assunto.charAt(0).toLowerCase() + assunto.slice(1);
}

function listarAssuntos(assuntos) {
  const nomes = assuntos.map((item) => formatarAssuntoNaFrase(item.assunto));
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

function montarJustificativa(item, taxaGeral) {
  if (item.prioridade === 'sem_dados') {
    const questoes = plural(item.total_respostas, 'questão', 'questões');
    return `Você respondeu apenas ${item.total_respostas} ${questoes} deste conteúdo. Ainda não há dados suficientes para avaliar seu desempenho.`;
  }

  const partes = [
    `Você respondeu ${item.total_respostas} questões deste conteúdo e acertou ${Math.round(item.taxa_acerto)}%.`
  ];

  if (item.taxa_acerto < taxaGeral) {
    partes.push(`Sua taxa está abaixo da sua média geral de ${Math.round(taxaGeral)}%.`);
  } else if (item.taxa_acerto - taxaGeral >= DIFERENCA_ACIMA_DA_MEDIA) {
    partes.push(`Sua taxa está acima da sua média geral de ${Math.round(taxaGeral)}%.`);
  } else {
    partes.push(`Sua taxa está em linha com a sua média geral de ${Math.round(taxaGeral)}%.`);
  }

  if (item.tendencia === 'piora') {
    partes.push(`Nas últimas ${item.respostas_recentes} questões, sua taxa caiu para ${Math.round(item.taxa_recente)}%.`);
  } else if (item.tendencia === 'melhora') {
    partes.push(`Nas últimas ${item.respostas_recentes} questões, sua taxa subiu para ${Math.round(item.taxa_recente)}%.`);
  }

  if (item.sessoes_recentes >= 2 && item.sessoes_com_erro >= 2) {
    partes.push(
      `Você errou questões deste conteúdo em ${item.sessoes_com_erro} das últimas ${item.sessoes_recentes} sessões de estudo.`
    );
  }

  if (item.assuntos_dificeis.length > 0) {
    partes.push(
      `Nas últimas questões, você apresentou maior dificuldade em ${listarAssuntos(item.assuntos_dificeis)}.`
    );
  }

  if (item.questoes_erro_recorrente > 0) {
    partes.push(
      item.questoes_erro_recorrente === 1
        ? '1 questão foi errada mais de uma vez.'
        : `${item.questoes_erro_recorrente} questões foram erradas mais de uma vez.`
    );
  }

  if (
    item.dias_sem_atividade !== null &&
    item.dias_sem_atividade === item.dias_sem_estudar &&
    item.dias_sem_atividade > 0
  ) {
    const dias = plural(item.dias_sem_atividade, 'dia', 'dias');
    partes.push(`Você estudou este conteúdo pela última vez há ${item.dias_sem_atividade} ${dias}.`);
  } else if (item.dias_sem_responder !== null && item.dias_sem_responder > 0) {
    const dias = plural(item.dias_sem_responder, 'dia', 'dias');
    partes.push(`A última resposta foi há ${item.dias_sem_responder} ${dias}.`);
  }

  return partes.join(' ');
}

function montarRecomendacao(item) {
  const revisaoPorTempo =
    item.prioridade === 'media' && item.taxa_acerto >= analiseDesempenhoService.TAXA_PRIORIDADE_MEDIA;
  const base = revisaoPorTempo ? RECOMENDACOES.revisao_por_tempo : RECOMENDACOES[item.prioridade];

  if (item.prioridade === 'sem_dados' || item.questoes_pendentes === 0) {
    return base;
  }

  const erros = plural(item.questoes_pendentes, 'o erro pendente', `os ${item.questoes_pendentes} erros pendentes`);
  return `${base} Comece refazendo ${erros} no caderno de erros.`;
}

async function getPlanoEstudo({ usuarioId }) {
  const [resumo, porConteudo, porMateria, recentes, sessoes, assuntos, erros, atividades] = await Promise.all([
    respostaRepository.getDesempenhoResumo(usuarioId),
    respostaRepository.getDesempenhoPorConteudo(usuarioId),
    respostaRepository.getDesempenhoPorMateria(usuarioId),
    respostaRepository.getDesempenhoRecentePorConteudo(
      usuarioId,
      analiseDesempenhoService.JANELA_RESPOSTAS_RECENTES
    ),
    respostaRepository.getSessoesRecentesPorConteudo(usuarioId, analiseDesempenhoService.SESSOES_ANALISADAS),
    respostaRepository.getErrosRecentesPorAssunto(
      usuarioId,
      analiseDesempenhoService.JANELA_RESPOSTAS_ASSUNTOS
    ),
    cadernoErrosRepository.getResumoErrosPorConteudo(
      usuarioId,
      analiseDesempenhoService.MINIMO_ERROS_RECORRENTE
    ),
    atividadeEstudoRepository.findUltimaPorConteudo(usuarioId)
  ]);

  const linhas = analiseDesempenhoService.combinarDadosPorConteudo({
    porConteudo,
    recentes,
    sessoes,
    assuntos,
    erros,
    atividades
  });
  const itensAnalisados = analiseDesempenhoService.analisarConteudos(linhas);
  const taxaGeral = analiseDesempenhoService.calcularTaxa(
    resumo.total_acertos || 0,
    resumo.total_respostas || 0
  );

  const itens = itensAnalisados.map((item) => ({
    ...item,
    justificativa: montarJustificativa(item, taxaGeral),
    recomendacao: montarRecomendacao(item)
  }));

  return toPlanoEstudoResponseDto({
    resumo,
    taxaGeral,
    itens,
    diagnosticoMaterias: analiseDesempenhoService.analisarMaterias(porMateria, taxaGeral),
    temDadosSuficientes: analiseDesempenhoService.temDadosSuficientes(itensAnalisados),
    minimoRespostas: analiseDesempenhoService.MINIMO_RESPOSTAS_GERAL
  });
}

module.exports = {
  getPlanoEstudo
};
