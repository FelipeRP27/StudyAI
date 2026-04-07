function toMateriaResponseDto(materia) {
  return {
    id: materia.id,
    usuario_id: materia.usuario_id,
    nome: materia.nome,
    descricao: materia.descricao,
    created_at: materia.created_at
  };
}

function toMateriaListResponseDto(materias) {
  return materias.map(toMateriaResponseDto);
}

module.exports = {
  toMateriaResponseDto,
  toMateriaListResponseDto
};
