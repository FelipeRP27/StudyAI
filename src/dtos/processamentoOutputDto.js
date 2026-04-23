function toProcessamentoResponseDto(processamento) {
  return {
    id: processamento.id,
    conteudo_id: processamento.conteudo_id,
    usuario_id: processamento.usuario_id,
    tipo: processamento.tipo,
    status: processamento.status,
    erro: processamento.erro,
    iniciado_em: processamento.iniciado_em,
    concluido_em: processamento.concluido_em
  };
}

function toProcessamentoListResponseDto(processamentos) {
  return processamentos.map(toProcessamentoResponseDto);
}

module.exports = {
  toProcessamentoResponseDto,
  toProcessamentoListResponseDto
};
