function toAlternativaResponseDto(alternativa) {
  return {
    id: alternativa.id,
    questao_id: alternativa.questao_id,
    texto: alternativa.texto,
    is_correta: alternativa.is_correta,
    justificativa: alternativa.justificativa ?? null,
    created_at: alternativa.created_at
  };
}

function toQuestaoResponseDto(questao) {
  return {
    id: questao.id,
    conteudo_id: questao.conteudo_id,
    enunciado: questao.enunciado,
    created_at: questao.created_at,
    alternativas: (questao.alternativas || []).map(toAlternativaResponseDto)
  };
}

function toQuestaoListResponseDto(questoes) {
  return questoes.map(toQuestaoResponseDto);
}

module.exports = {
  toQuestaoResponseDto,
  toQuestaoListResponseDto
};
