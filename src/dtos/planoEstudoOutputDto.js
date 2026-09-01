function toItemDto(item) {
  return {
    conteudo_id: item.conteudo_id,
    conteudo_titulo: item.conteudo_titulo,
    materia_id: item.materia_id,
    materia_nome: item.materia_nome,
    total_respostas: item.total_respostas,
    total_acertos: item.total_acertos,
    taxa_acerto: item.taxa_acerto,
    prioridade: item.prioridade,
    dias_sem_responder: item.dias_sem_responder,
    justificativa: item.justificativa,
    recomendacao: item.recomendacao
  };
}

function toPlanoEstudoResponseDto({
  resumo,
  taxaGeral,
  itens,
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
      conteudos_analisados: itens.length
    },
    itens: itens.map(toItemDto)
  };
}

module.exports = {
  toPlanoEstudoResponseDto
};
