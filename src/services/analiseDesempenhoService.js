const MINIMO_RESPOSTAS_POR_CONTEUDO = 5;
const MINIMO_RESPOSTAS_GERAL = 10;
const TAXA_PRIORIDADE_ALTA = 60;
const TAXA_PRIORIDADE_MEDIA = 80;

const PESO_PRIORIDADE = {
  alta: 0,
  media: 1,
  baixa: 2,
  sem_dados: 3
};

function calcularTaxa(acertos, total) {
  if (!total) return 0;
  return Number(((acertos / total) * 100).toFixed(2));
}

function classificarPrioridade({ totalRespostas, taxaAcerto }) {
  if (totalRespostas < MINIMO_RESPOSTAS_POR_CONTEUDO) return 'sem_dados';
  if (taxaAcerto < TAXA_PRIORIDADE_ALTA) return 'alta';
  if (taxaAcerto < TAXA_PRIORIDADE_MEDIA) return 'media';
  return 'baixa';
}

function calcularDiasSemResponder(ultimaRespostaEm, agora = new Date()) {
  if (!ultimaRespostaEm) return null;
  const ultima = new Date(ultimaRespostaEm);
  if (Number.isNaN(ultima.getTime())) return null;
  const milissegundosPorDia = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((agora - ultima) / milissegundosPorDia));
}

function ordenarPorRelevancia(itens) {
  return [...itens].sort((a, b) => {
    const pesoA = PESO_PRIORIDADE[a.prioridade];
    const pesoB = PESO_PRIORIDADE[b.prioridade];
    if (pesoA !== pesoB) return pesoA - pesoB;
    if (a.taxa_acerto !== b.taxa_acerto) return a.taxa_acerto - b.taxa_acerto;
    return (b.dias_sem_responder || 0) - (a.dias_sem_responder || 0);
  });
}

function analisarConteudos(linhas, { agora = new Date() } = {}) {
  const itens = linhas.map((linha) => {
    const totalRespostas = linha.total_respostas || 0;
    const totalAcertos = linha.total_acertos || 0;
    const taxaAcerto = calcularTaxa(totalAcertos, totalRespostas);

    return {
      conteudo_id: linha.conteudo_id,
      conteudo_titulo: linha.conteudo_titulo,
      materia_id: linha.materia_id,
      materia_nome: linha.materia_nome,
      total_respostas: totalRespostas,
      total_acertos: totalAcertos,
      taxa_acerto: taxaAcerto,
      prioridade: classificarPrioridade({ totalRespostas, taxaAcerto }),
      dias_sem_responder: calcularDiasSemResponder(linha.ultima_resposta_em, agora)
    };
  });

  return ordenarPorRelevancia(itens);
}

function temDadosSuficientes(itens) {
  const totalRespostas = itens.reduce((soma, item) => soma + item.total_respostas, 0);
  const conteudosClassificados = itens.filter((item) => item.prioridade !== 'sem_dados');
  return totalRespostas >= MINIMO_RESPOSTAS_GERAL && conteudosClassificados.length > 0;
}

module.exports = {
  MINIMO_RESPOSTAS_POR_CONTEUDO,
  MINIMO_RESPOSTAS_GERAL,
  TAXA_PRIORIDADE_ALTA,
  TAXA_PRIORIDADE_MEDIA,
  calcularTaxa,
  classificarPrioridade,
  calcularDiasSemResponder,
  analisarConteudos,
  temDadosSuficientes
};
