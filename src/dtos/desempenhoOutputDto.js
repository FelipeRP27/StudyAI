function calcularTaxa(acertos, total) {
  if (!total) return 0;
  return Number(((acertos / total) * 100).toFixed(2));
}

function toResumoDto(resumo) {
  const totalRespostas = resumo.total_respostas || 0;
  const totalAcertos = resumo.total_acertos || 0;
  const totalErros = resumo.total_erros || 0;

  return {
    total_respostas: totalRespostas,
    total_acertos: totalAcertos,
    total_erros: totalErros,
    taxa_acerto: calcularTaxa(totalAcertos, totalRespostas)
  };
}

function toDesempenhoPorMateriaDto(rows) {
  return rows.map((row) => ({
    materia_id: row.materia_id,
    materia_nome: row.materia_nome,
    total_respostas: row.total_respostas,
    total_acertos: row.total_acertos,
    taxa_acerto: calcularTaxa(row.total_acertos, row.total_respostas)
  }));
}

function toEvolucaoDto(rows) {
  return rows.map((row) => ({
    dia: row.dia,
    total_respostas: row.total_respostas,
    total_acertos: row.total_acertos,
    taxa_acerto: calcularTaxa(row.total_acertos, row.total_respostas)
  }));
}

function toDesempenhoResponseDto({ resumo, porMateria, evolucao }) {
  return {
    resumo: toResumoDto(resumo),
    por_materia: toDesempenhoPorMateriaDto(porMateria),
    evolucao: toEvolucaoDto(evolucao)
  };
}

function toDesempenhoPorConteudoDto(rows) {
  return rows.map((row) => ({
    conteudo_id: row.conteudo_id,
    conteudo_titulo: row.conteudo_titulo,
    total_respostas: row.total_respostas,
    total_acertos: row.total_acertos,
    taxa_acerto: calcularTaxa(row.total_acertos, row.total_respostas)
  }));
}

function toDesempenhoMateriaResponseDto({ materia, resumo, porConteudo, evolucao }) {
  return {
    materia: {
      id: materia.id,
      nome: materia.nome,
      descricao: materia.descricao || null
    },
    resumo: toResumoDto(resumo),
    por_conteudo: toDesempenhoPorConteudoDto(porConteudo),
    evolucao: toEvolucaoDto(evolucao)
  };
}

module.exports = {
  toDesempenhoResponseDto,
  toDesempenhoMateriaResponseDto
};
