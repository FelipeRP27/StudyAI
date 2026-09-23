function toConteudoPrioritarioDto(item) {
  return {
    conteudo_id: item.conteudo_id,
    conteudo_titulo: item.conteudo_titulo,
    materia_id: item.materia_id,
    materia_nome: item.materia_nome,
    prioridade: item.prioridade,
    taxa_acerto: item.taxa_acerto,
    tendencia: item.tendencia,
    dias_sem_estudar: item.dias_sem_estudar,
    questoes_pendentes: item.questoes_pendentes,
    assuntos_dificeis: item.assuntos_dificeis,
    justificativa: item.justificativa,
    acoes: item.acoes
  };
}

function toPainelResponseDto({ plano, erros, evolucao, prioritarios, revisoesRecomendadas, proximasAcoes }) {
  return {
    status: plano.status,
    mensagem: plano.mensagem,
    como_voce_esta: {
      total_respostas: plano.resumo.total_respostas,
      total_acertos: plano.resumo.total_acertos,
      taxa_acerto: plano.resumo.taxa_acerto,
      evolucao,
      materias_fortes: plano.diagnostico_materias.materias_fortes,
      materias_atencao: plano.diagnostico_materias.materias_atencao
    },
    onde_focar: {
      conteudos_prioritarios: prioritarios.map(toConteudoPrioritarioDto),
      erros: {
        questoes: erros.questoes,
        pendentes: erros.pendentes,
        total_erros: erros.total_erros,
        assuntos: erros.por_assunto.slice(0, 3)
      },
      revisoes_recomendadas: revisoesRecomendadas.map(toConteudoPrioritarioDto)
    },
    o_que_fazer_agora: proximasAcoes
  };
}

module.exports = {
  toPainelResponseDto
};
