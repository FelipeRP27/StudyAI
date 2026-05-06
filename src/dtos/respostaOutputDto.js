function toRespostaItemDto(resposta) {
  return {
    id: resposta.id,
    questao_id: resposta.questao_id,
    alternativa_id: resposta.alternativa_id,
    is_correta: resposta.is_correta,
    created_at: resposta.created_at
  };
}

function toRespostaResponseDto({ resposta, alternativaCorreta }) {
  return {
    resposta: toRespostaItemDto(resposta),
    feedback: {
      acertou: resposta.is_correta,
      mensagem: resposta.is_correta
        ? 'Resposta correta!'
        : 'Resposta incorreta. Confira a alternativa correta abaixo.',
      alternativa_correta: alternativaCorreta
        ? {
            id: alternativaCorreta.id,
            texto: alternativaCorreta.texto
          }
        : null
    }
  };
}

function toRespostaListResponseDto(respostas) {
  return respostas.map(toRespostaItemDto);
}

module.exports = {
  toRespostaResponseDto,
  toRespostaListResponseDto
};
