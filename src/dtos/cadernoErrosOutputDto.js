const { toQuestaoResponseDto } = require('./questaoOutputDto');

function toErroItemDto(item) {
  return {
    questao: toQuestaoResponseDto({
      id: item.questao_id,
      conteudo_id: item.conteudo_id,
      enunciado: item.enunciado,
      assunto: item.assunto,
      created_at: item.questao_criada_em,
      alternativas: item.alternativas
    }),
    conteudo_id: item.conteudo_id,
    conteudo_titulo: item.conteudo_titulo,
    materia_id: item.materia_id,
    materia_nome: item.materia_nome,
    total_respostas: item.total_respostas,
    total_erros: item.total_erros,
    status: item.status,
    ultimo_erro_em: item.ultimo_erro_em,
    ultima_resposta_em: item.ultima_resposta_em
  };
}

function toContagemDto(contagem) {
  return {
    questoes: contagem.questoes,
    pendentes: contagem.pendentes,
    revisadas: contagem.revisadas,
    total_erros: contagem.total_erros
  };
}

function toCadernoErrosResponseDto({ contagem, itens }) {
  return {
    resumo: toContagemDto(contagem),
    itens: itens.map(toErroItemDto)
  };
}

function toCadernoErrosResumoResponseDto({ contagem, porMateria, porConteudo, porAssunto }) {
  return {
    ...toContagemDto(contagem),
    por_materia: porMateria.map((grupo) => ({
      materia_id: grupo.materia_id,
      materia_nome: grupo.materia_nome,
      ...toContagemDto(grupo)
    })),
    por_conteudo: porConteudo.map((grupo) => ({
      conteudo_id: grupo.conteudo_id,
      conteudo_titulo: grupo.conteudo_titulo,
      materia_id: grupo.materia_id,
      materia_nome: grupo.materia_nome,
      ...toContagemDto(grupo)
    })),
    por_assunto: porAssunto.map((grupo) => ({
      assunto: grupo.assunto,
      materia_id: grupo.materia_id,
      materia_nome: grupo.materia_nome,
      ...toContagemDto(grupo)
    }))
  };
}

module.exports = {
  toCadernoErrosResponseDto,
  toCadernoErrosResumoResponseDto
};
