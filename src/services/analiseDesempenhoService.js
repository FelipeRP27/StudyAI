const MINIMO_RESPOSTAS_POR_CONTEUDO = 5;
const MINIMO_RESPOSTAS_GERAL = 10;
const TAXA_PRIORIDADE_ALTA = 60;
const TAXA_PRIORIDADE_MEDIA = 80;

const JANELA_RESPOSTAS_RECENTES = 10;
const JANELA_RESPOSTAS_ASSUNTOS = 20;
const SESSOES_ANALISADAS = 5;
const MINIMO_RESPOSTAS_TENDENCIA = 5;
const VARIACAO_TENDENCIA = 10;
const MINIMO_ERROS_ASSUNTO = 2;
const MAXIMO_ASSUNTOS_DIFICEIS = 2;
const MINIMO_ERROS_RECORRENTE = 2;
const MAXIMO_MATERIAS_FORTES = 3;

const LIMIAR_PONTUACAO_ALTA = 100 - TAXA_PRIORIDADE_ALTA;
const LIMIAR_PONTUACAO_MEDIA = 100 - TAXA_PRIORIDADE_MEDIA;

const AJUSTES_PONTUACAO = {
  tendenciaPiora: 10,
  tendenciaMelhora: -10,
  sessoesComErroFrequentes: 10,
  sessoesComErroRepetidas: 5,
  diasSemPraticaLongo: 10,
  diasSemPraticaModerado: 5,
  errosRecorrentes: 5
};

const DIAS_SEM_PRATICA_MODERADO = 14;
const DIAS_SEM_PRATICA_LONGO = 30;

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

function calcularDiasSemResponder(ultimaRespostaEm, agora = new Date()) {
  if (!ultimaRespostaEm) return null;
  const ultima = new Date(ultimaRespostaEm);
  if (Number.isNaN(ultima.getTime())) return null;
  const milissegundosPorDia = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((agora - ultima) / milissegundosPorDia));
}

function calcularTendencia({ totalRespostas, totalAcertos, respostasRecentes, acertosRecentes }) {
  const respostasAnteriores = totalRespostas - respostasRecentes;

  if (
    respostasRecentes < MINIMO_RESPOSTAS_TENDENCIA ||
    respostasAnteriores < MINIMO_RESPOSTAS_TENDENCIA
  ) {
    return 'indefinida';
  }

  const taxaRecente = calcularTaxa(acertosRecentes, respostasRecentes);
  const taxaAnterior = calcularTaxa(totalAcertos - acertosRecentes, respostasAnteriores);
  const variacao = taxaRecente - taxaAnterior;

  if (variacao >= VARIACAO_TENDENCIA) return 'melhora';
  if (variacao <= -VARIACAO_TENDENCIA) return 'piora';
  return 'estavel';
}

function identificarAssuntosDificeis(assuntos = []) {
  return assuntos
    .filter((item) => item.assunto && item.erros >= MINIMO_ERROS_ASSUNTO)
    .sort((a, b) => b.erros - a.erros || calcularTaxa(a.erros, a.respostas) - calcularTaxa(b.erros, b.respostas))
    .slice(0, MAXIMO_ASSUNTOS_DIFICEIS)
    .map((item) => ({ assunto: item.assunto, erros: item.erros, respostas: item.respostas }));
}

function calcularPontuacao({
  taxaAcerto,
  tendencia = 'indefinida',
  sessoesRecentes = 0,
  sessoesComErro = 0,
  diasSemResponder = null,
  questoesErroRecorrente = 0
}) {
  let pontuacao = 100 - taxaAcerto;

  if (tendencia === 'piora') pontuacao += AJUSTES_PONTUACAO.tendenciaPiora;
  if (tendencia === 'melhora') pontuacao += AJUSTES_PONTUACAO.tendenciaMelhora;

  if (sessoesRecentes >= 2) {
    if (sessoesComErro >= 3) pontuacao += AJUSTES_PONTUACAO.sessoesComErroFrequentes;
    else if (sessoesComErro === 2) pontuacao += AJUSTES_PONTUACAO.sessoesComErroRepetidas;
  }

  if (diasSemResponder !== null) {
    if (diasSemResponder >= DIAS_SEM_PRATICA_LONGO) pontuacao += AJUSTES_PONTUACAO.diasSemPraticaLongo;
    else if (diasSemResponder >= DIAS_SEM_PRATICA_MODERADO) pontuacao += AJUSTES_PONTUACAO.diasSemPraticaModerado;
  }

  if (questoesErroRecorrente > 0) pontuacao += AJUSTES_PONTUACAO.errosRecorrentes;

  return Number(Math.max(0, pontuacao).toFixed(2));
}

function classificarPrioridade({ totalRespostas, taxaAcerto, pontuacao }) {
  if (totalRespostas < MINIMO_RESPOSTAS_POR_CONTEUDO) return 'sem_dados';
  const pontuacaoFinal = pontuacao ?? 100 - taxaAcerto;
  if (pontuacaoFinal > LIMIAR_PONTUACAO_ALTA) return 'alta';
  if (pontuacaoFinal > LIMIAR_PONTUACAO_MEDIA) return 'media';
  return 'baixa';
}

function ordenarPorRelevancia(itens) {
  return [...itens].sort((a, b) => {
    const pesoA = PESO_PRIORIDADE[a.prioridade];
    const pesoB = PESO_PRIORIDADE[b.prioridade];
    if (pesoA !== pesoB) return pesoA - pesoB;
    if (a.pontuacao !== b.pontuacao) return b.pontuacao - a.pontuacao;
    if (a.taxa_acerto !== b.taxa_acerto) return a.taxa_acerto - b.taxa_acerto;
    return (b.dias_sem_responder || 0) - (a.dias_sem_responder || 0);
  });
}

function indexarPorConteudo(linhas = []) {
  return new Map(linhas.map((linha) => [linha.conteudo_id, linha]));
}

function combinarDadosPorConteudo({ porConteudo, recentes = [], sessoes = [], assuntos = [], erros = [] }) {
  const recentesPorConteudo = indexarPorConteudo(recentes);
  const sessoesPorConteudo = indexarPorConteudo(sessoes);
  const errosPorConteudo = indexarPorConteudo(erros);
  const assuntosPorConteudo = new Map();

  for (const linha of assuntos) {
    const lista = assuntosPorConteudo.get(linha.conteudo_id) || [];
    lista.push(linha);
    assuntosPorConteudo.set(linha.conteudo_id, lista);
  }

  return porConteudo.map((linha) => {
    const recente = recentesPorConteudo.get(linha.conteudo_id);
    const sessao = sessoesPorConteudo.get(linha.conteudo_id);
    const erro = errosPorConteudo.get(linha.conteudo_id);

    return {
      ...linha,
      respostas_recentes: recente?.respostas_recentes,
      acertos_recentes: recente?.acertos_recentes,
      sessoes_recentes: sessao?.sessoes_recentes,
      sessoes_com_erro: sessao?.sessoes_com_erro,
      questoes_erro_recorrente: erro?.questoes_erro_recorrente,
      questoes_pendentes: erro?.questoes_pendentes,
      assuntos: assuntosPorConteudo.get(linha.conteudo_id) || []
    };
  });
}

function analisarConteudo(linha, agora) {
  const totalRespostas = linha.total_respostas || 0;
  const totalAcertos = linha.total_acertos || 0;
  const taxaAcerto = calcularTaxa(totalAcertos, totalRespostas);
  const temDadosRecentes = Number.isInteger(linha.respostas_recentes) && linha.respostas_recentes > 0;
  const respostasRecentes = temDadosRecentes ? linha.respostas_recentes : 0;
  const acertosRecentes = temDadosRecentes ? linha.acertos_recentes || 0 : 0;
  const diasSemResponder = calcularDiasSemResponder(linha.ultima_resposta_em, agora);
  const sessoesRecentes = linha.sessoes_recentes || 0;
  const sessoesComErro = linha.sessoes_com_erro || 0;
  const questoesErroRecorrente = linha.questoes_erro_recorrente || 0;

  const tendencia = temDadosRecentes
    ? calcularTendencia({ totalRespostas, totalAcertos, respostasRecentes, acertosRecentes })
    : 'indefinida';

  const pontuacao = calcularPontuacao({
    taxaAcerto,
    tendencia,
    sessoesRecentes,
    sessoesComErro,
    diasSemResponder,
    questoesErroRecorrente
  });

  return {
    conteudo_id: linha.conteudo_id,
    conteudo_titulo: linha.conteudo_titulo,
    materia_id: linha.materia_id,
    materia_nome: linha.materia_nome,
    total_respostas: totalRespostas,
    total_acertos: totalAcertos,
    taxa_acerto: taxaAcerto,
    respostas_recentes: respostasRecentes,
    taxa_recente: temDadosRecentes ? calcularTaxa(acertosRecentes, respostasRecentes) : null,
    tendencia,
    sessoes_recentes: sessoesRecentes,
    sessoes_com_erro: sessoesComErro,
    questoes_erro_recorrente: questoesErroRecorrente,
    questoes_pendentes: linha.questoes_pendentes || 0,
    assuntos_dificeis: identificarAssuntosDificeis(linha.assuntos),
    dias_sem_responder: diasSemResponder,
    pontuacao,
    prioridade: classificarPrioridade({ totalRespostas, taxaAcerto, pontuacao })
  };
}

function analisarConteudos(linhas, { agora = new Date() } = {}) {
  return ordenarPorRelevancia(linhas.map((linha) => analisarConteudo(linha, agora)));
}

function analisarMaterias(linhas, taxaGeral) {
  const classificaveis = linhas
    .filter((linha) => (linha.total_respostas || 0) >= MINIMO_RESPOSTAS_POR_CONTEUDO)
    .map((linha) => {
      const taxaAcerto = calcularTaxa(linha.total_acertos || 0, linha.total_respostas);
      return {
        materia_id: linha.materia_id,
        materia_nome: linha.materia_nome,
        total_respostas: linha.total_respostas,
        taxa_acerto: taxaAcerto,
        diferenca_media: Number((taxaAcerto - taxaGeral).toFixed(2))
      };
    });

  if (classificaveis.length < 2) {
    return { materias_atencao: [], materias_fortes: [] };
  }

  return {
    materias_atencao: classificaveis
      .filter((materia) => materia.taxa_acerto < taxaGeral)
      .sort((a, b) => a.taxa_acerto - b.taxa_acerto),
    materias_fortes: classificaveis
      .filter((materia) => materia.taxa_acerto >= taxaGeral)
      .sort((a, b) => b.taxa_acerto - a.taxa_acerto)
      .slice(0, MAXIMO_MATERIAS_FORTES)
  };
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
  JANELA_RESPOSTAS_RECENTES,
  JANELA_RESPOSTAS_ASSUNTOS,
  SESSOES_ANALISADAS,
  MINIMO_ERROS_RECORRENTE,
  AJUSTES_PONTUACAO,
  calcularTaxa,
  calcularTendencia,
  calcularPontuacao,
  classificarPrioridade,
  calcularDiasSemResponder,
  identificarAssuntosDificeis,
  combinarDadosPorConteudo,
  analisarConteudos,
  analisarMaterias,
  temDadosSuficientes
};
