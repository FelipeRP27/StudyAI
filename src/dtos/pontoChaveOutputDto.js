function toPontoChaveResponseDto(pontoChave) {
  return {
    id: pontoChave.id,
    conteudo_id: pontoChave.conteudo_id,
    texto: pontoChave.texto,
    created_at: pontoChave.created_at
  };
}

function toPontoChaveListResponseDto(pontosChave) {
  return pontosChave.map(toPontoChaveResponseDto);
}

module.exports = {
  toPontoChaveResponseDto,
  toPontoChaveListResponseDto
};
