function toRespostaItemDto(resposta) {
  return {
    id: resposta.id,
    questao_id: resposta.questao_id,
    alternativa_id: resposta.alternativa_id,
    is_correta: resposta.is_correta,
    created_at: resposta.created_at
  };
}

function toRespostaResponseDto({ resposta, alternativaCorreta, alternativaEscolhida }) {
  return {
    resposta: toRespostaItemDto(resposta),
    feedback: {
      acertou: resposta.is_correta,
      mensagem: resposta.is_correta
        ? 'Resposta correta!'
        : 'Resposta incorreta. A alternativa correta está destacada em verde acima.',
      alternativa_correta: alternativaCorreta
        ? {
            id: alternativaCorreta.id,
            texto: alternativaCorreta.texto,
            justificativa: alternativaCorreta.justificativa ?? null
          }
        : null,
      alternativa_escolhida: alternativaEscolhida
        ? {
            id: alternativaEscolhida.id,
            texto: alternativaEscolhida.texto,
            justificativa: alternativaEscolhida.justificativa ?? null
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
