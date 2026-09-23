function toAtividadeEstudoResponseDto({ atividade, registrada }) {
  return {
    registrada,
    atividade: atividade
      ? {
          id: atividade.id,
          conteudo_id: atividade.conteudo_id,
          tipo: atividade.tipo,
          created_at: atividade.created_at
        }
      : null
  };
}

module.exports = {
  toAtividadeEstudoResponseDto
};
