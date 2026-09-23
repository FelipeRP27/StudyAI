const { toQuestaoResponseDto } = require('./questaoOutputDto');

function statusDaQuestao(linha) {
  if (!linha.total_respostas || linha.total_respostas === 0) return 'nao_respondida';
  if (linha.total_erros > 0 && linha.ultima_resposta_correta === false) return 'erro_pendente';
  if (linha.total_erros > 0) return 'ja_errada';
  return 'ja_respondida';
}

function toQuestaoDaSessaoDto(linha) {
  return {
    ...toQuestaoResponseDto({
      id: linha.id,
      conteudo_id: linha.conteudo_id,
      enunciado: linha.enunciado,
      assunto: linha.assunto,
      created_at: linha.created_at,
      alternativas: linha.alternativas
    }),
    status: statusDaQuestao(linha),
    total_respostas: linha.total_respostas || 0,
    total_erros: linha.total_erros || 0
  };
}

function toSessaoResponseDto({ conteudo, materiaNome, quantidadeSolicitada, totalDisponivel, questoes }) {
  const faltam = Math.max(0, quantidadeSolicitada - questoes.length);

  return {
    conteudo: {
      id: conteudo.id,
      titulo: conteudo.titulo,
      materia_id: conteudo.materia_id,
      materia_nome: materiaNome ?? null
    },
    quantidade_solicitada: quantidadeSolicitada,
    total_disponivel: totalDisponivel,
    faltam,
    precisa_gerar_questoes: faltam > 0,
    questoes: questoes.map(toQuestaoDaSessaoDto)
  };
}

function toDiagnosticoResponseDto({ quantidadeSolicitada, questoes, mensagem, minimoRespostas }) {
  return {
    status: questoes.length > 0 ? 'ok' : 'sem_questoes',
    mensagem,
    minimo_respostas: minimoRespostas,
    quantidade_solicitada: quantidadeSolicitada,
    questoes: questoes.map((linha) => ({
      ...toQuestaoDaSessaoDto(linha),
      conteudo_titulo: linha.conteudo_titulo,
      materia_id: linha.materia_id,
      materia_nome: linha.materia_nome
    }))
  };
}

module.exports = {
  statusDaQuestao,
  toSessaoResponseDto,
  toDiagnosticoResponseDto
};
