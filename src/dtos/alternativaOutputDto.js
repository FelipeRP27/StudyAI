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

function toAlternativaListResponseDto(alternativas) {
  return alternativas.map(toAlternativaResponseDto);
}

module.exports = {
  toAlternativaResponseDto,
  toAlternativaListResponseDto
};
