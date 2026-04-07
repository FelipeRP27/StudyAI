function toConteudoResponseDto(conteudo) {
  return {
    id: conteudo.id,
    titulo: conteudo.titulo,
    texto: conteudo.texto,
    materia_id: conteudo.materia_id,
    usuario_id: conteudo.usuario_id,
    created_at: conteudo.created_at
  };
}

function toConteudoListResponseDto(conteudos) {
  return conteudos.map(toConteudoResponseDto);
}

module.exports = {
  toConteudoResponseDto,
  toConteudoListResponseDto
};
