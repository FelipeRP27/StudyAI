function toResumoResponseDto(resumo) {
  return {
    id: resumo.id,
    conteudo_id: resumo.conteudo_id,
    texto: resumo.texto,
    created_at: resumo.created_at
  };
}

function toResumoListResponseDto(resumos) {
  return resumos.map(toResumoResponseDto);
}

module.exports = {
  toResumoResponseDto,
  toResumoListResponseDto
};
