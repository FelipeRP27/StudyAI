function toItemDto(item) {
  return {
    conteudo_id: item.conteudo_id,
    conteudo_titulo: item.conteudo_titulo,
    materia_id: item.materia_id,
    materia_nome: item.materia_nome,
    total_respostas: item.total_respostas,
    total_acertos: item.total_acertos,
    taxa_acerto: item.taxa_acerto,
    respostas_recentes: item.respostas_recentes ?? 0,
    taxa_recente: item.taxa_recente ?? null,
    tendencia: item.tendencia ?? 'indefinida',
    sessoes_recentes: item.sessoes_recentes ?? 0,
    sessoes_com_erro: item.sessoes_com_erro ?? 0,
    questoes_erro_recorrente: item.questoes_erro_recorrente ?? 0,
    questoes_pendentes: item.questoes_pendentes ?? 0,
    assuntos_dificeis: (item.assuntos_dificeis || []).map((assunto) => ({
      assunto: assunto.assunto,
      erros: assunto.erros,
      respostas: assunto.respostas
    })),
    pontuacao: item.pontuacao ?? null,
    prioridade: item.prioridade,
    dias_sem_responder: item.dias_sem_responder,
    justificativa: item.justificativa,
    recomendacao: item.recomendacao
  };
}

function toMateriaDiagnosticoDto(materia) {
  return {
    materia_id: materia.materia_id,
    materia_nome: materia.materia_nome,
    total_respostas: materia.total_respostas,
    taxa_acerto: materia.taxa_acerto,
    diferenca_media: materia.diferenca_media
  };
}

function toPlanoEstudoResponseDto({
  resumo,
  taxaGeral,
  itens,
  diagnosticoMaterias = { materias_atencao: [], materias_fortes: [] },
  temDadosSuficientes,
  minimoRespostas
}) {
  const totalRespostas = resumo.total_respostas || 0;

  return {
    status: temDadosSuficientes ? 'ok' : 'dados_insuficientes',
    mensagem: temDadosSuficientes
      ? 'Plano de estudo gerado a partir do seu desempenho registrado.'
      : `Ainda precisamos conhecer melhor seu desempenho. Responda pelo menos ${minimoRespostas} questões para que o StudyAI identifique seus pontos fortes e suas principais dificuldades.`,
    acao_inicial: temDadosSuficientes ? null : 'Responder questões de diagnóstico',
    resumo: {
      total_respostas: totalRespostas,
      total_acertos: resumo.total_acertos || 0,
      taxa_acerto: taxaGeral,
      conteudos_analisados: itens.length,
      questoes_pendentes: itens.reduce((soma, item) => soma + (item.questoes_pendentes || 0), 0)
    },
    diagnostico_materias: {
      materias_atencao: diagnosticoMaterias.materias_atencao.map(toMateriaDiagnosticoDto),
      materias_fortes: diagnosticoMaterias.materias_fortes.map(toMateriaDiagnosticoDto)
    },
    itens: itens.map(toItemDto)
  };
}

module.exports = {
  toPlanoEstudoResponseDto
};
