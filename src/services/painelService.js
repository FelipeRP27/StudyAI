const respostaRepository = require('../repositories/respostaRepository');
const planoEstudoService = require('./planoEstudoService');
const cadernoErrosService = require('./cadernoErrosService');
const analiseDesempenhoService = require('./analiseDesempenhoService');
const { toPainelResponseDto } = require('../dtos/painelOutputDto');

const DIAS_EVOLUCAO = 30;
const DIAS_EVOLUCAO_RECENTE = 7;
const MAXIMO_PRIORITARIOS = 3;
const MAXIMO_ACOES = 3;
const DIAS_PARA_REVISAO = 14;

function calcularEvolucao(evolucao) {
  const agora = new Date();
  const limiteRecente = new Date(agora.getTime() - DIAS_EVOLUCAO_RECENTE * 24 * 60 * 60 * 1000);

  const totais = evolucao.reduce(
    (acumulado, dia) => {
      const recente = new Date(dia.dia) >= limiteRecente;
      return {
        respostas: acumulado.respostas + dia.total_respostas,
        acertos: acumulado.acertos + dia.total_acertos,
        respostas_recentes: acumulado.respostas_recentes + (recente ? dia.total_respostas : 0),
        acertos_recentes: acumulado.acertos_recentes + (recente ? dia.total_acertos : 0)
      };
    },
    { respostas: 0, acertos: 0, respostas_recentes: 0, acertos_recentes: 0 }
  );

  const taxaPeriodo = analiseDesempenhoService.calcularTaxa(totais.acertos, totais.respostas);
  const taxaRecente = analiseDesempenhoService.calcularTaxa(
    totais.acertos_recentes,
    totais.respostas_recentes
  );

  return {
    dias: DIAS_EVOLUCAO,
    dias_recentes: DIAS_EVOLUCAO_RECENTE,
    respostas_no_periodo: totais.respostas,
    respostas_recentes: totais.respostas_recentes,
    taxa_periodo: taxaPeriodo,
    taxa_recente: totais.respostas_recentes > 0 ? taxaRecente : null,
    variacao:
      totais.respostas_recentes > 0 && totais.respostas > totais.respostas_recentes
        ? Number((taxaRecente - taxaPeriodo).toFixed(2))
        : null
  };
}

function montarProximasAcoes(plano) {
  if (plano.status !== 'ok') {
    return [
      {
        tipo: 'diagnostico',
        rotulo: plano.acao_inicial || 'Responder questões de diagnóstico',
        rota: plano.acao_inicial_rota || '/plano/diagnostico',
        conteudo_id: null,
        conteudo_titulo: null,
        motivo: plano.mensagem
      }
    ];
  }

  return plano.itens
    .filter((item) => item.prioridade !== 'sem_dados')
    .slice(0, MAXIMO_ACOES)
    .map((item) => {
      const acao = item.acoes[0];
      return {
        tipo: acao.tipo,
        rotulo: acao.rotulo,
        rota: acao.rota,
        conteudo_id: item.conteudo_id,
        conteudo_titulo: item.conteudo_titulo,
        motivo: item.justificativa
      };
    });
}

async function getPainel({ usuarioId }) {
  const [plano, erros, evolucaoDiaria] = await Promise.all([
    planoEstudoService.getPlanoEstudo({ usuarioId }),
    cadernoErrosService.resumir({ usuarioId }),
    respostaRepository.getEvolucaoDiaria(usuarioId, DIAS_EVOLUCAO)
  ]);

  const prioritarios = plano.itens
    .filter((item) => item.prioridade === 'alta' || item.prioridade === 'media')
    .slice(0, MAXIMO_PRIORITARIOS);

  const revisoesRecomendadas = plano.itens
    .filter((item) => (item.dias_sem_estudar ?? 0) >= DIAS_PARA_REVISAO)
    .slice(0, MAXIMO_PRIORITARIOS);

  return toPainelResponseDto({
    plano,
    erros,
    evolucao: calcularEvolucao(evolucaoDiaria),
    prioritarios,
    revisoesRecomendadas,
    proximasAcoes: montarProximasAcoes(plano)
  });
}

module.exports = {
  DIAS_EVOLUCAO,
  DIAS_PARA_REVISAO,
  calcularEvolucao,
  montarProximasAcoes,
  getPainel
};
