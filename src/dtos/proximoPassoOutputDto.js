function toProximoPassoResponseDto({ passo, trilha, estado, minimoRespostas }) {
  return {
    etapa: passo.etapa,
    concluida: passo.etapa === 'pronto',
    titulo: passo.titulo,
    descricao: passo.descricao,
    acao: {
      rotulo: passo.rotulo,
      rota: passo.rota
    },
    progresso: {
      total_materias: estado.total_materias,
      total_conteudos: estado.total_conteudos,
      total_questoes: estado.total_questoes,
      total_respostas: estado.total_respostas,
      minimo_respostas: minimoRespostas,
      respostas_faltantes: Math.max(minimoRespostas - estado.total_respostas, 0)
    },
    trilha
  };
}

module.exports = {
  toProximoPassoResponseDto
};
