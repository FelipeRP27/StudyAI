const jornadaRepository = require('../repositories/jornadaRepository');
const analiseDesempenhoService = require('./analiseDesempenhoService');
const { toProximoPassoResponseDto } = require('../dtos/proximoPassoOutputDto');

const ETAPAS = ['criar_materia', 'criar_conteudo', 'gerar_material', 'responder_questoes'];

const ROTULO_DA_ETAPA = {
  criar_materia: 'Criar matéria',
  criar_conteudo: 'Adicionar conteúdo',
  gerar_material: 'Gerar material',
  responder_questoes: 'Responder questões'
};

function montarPasso(estado, minimoRespostas) {
  if (estado.total_materias === 0) {
    return {
      etapa: 'criar_materia',
      titulo: 'Crie sua primeira matéria',
      descricao: 'Uma matéria agrupa os conteúdos de uma mesma disciplina.',
      rotulo: 'Criar matéria',
      rota: '/materias'
    };
  }

  if (estado.total_conteudos === 0 || estado.materia_sem_conteudo_id !== null) {
    const materiaId = estado.materia_sem_conteudo_id || estado.primeira_materia_id;
    return {
      etapa: 'criar_conteudo',
      titulo: 'Adicione um conteúdo à matéria',
      descricao: 'Cole um texto teórico ou anexe um PDF para o StudyAI trabalhar em cima dele.',
      rotulo: 'Adicionar conteúdo',
      rota: `/materias/${materiaId}`
    };
  }

  if (estado.total_questoes === 0 || estado.conteudo_sem_questoes_id !== null) {
    const conteudoId = estado.conteudo_sem_questoes_id;
    return {
      etapa: 'gerar_material',
      titulo: 'Gere o material de estudo',
      descricao: 'Em um clique a IA produz resumo, pontos-chave, questões e flashcards.',
      rotulo: 'Gerar material',
      rota: `/conteudos/${conteudoId}`
    };
  }

  if (estado.total_respostas < minimoRespostas) {
    const faltam = minimoRespostas - estado.total_respostas;
    return {
      etapa: 'responder_questoes',
      titulo:
        estado.total_respostas === 0
          ? 'Responda suas primeiras questões'
          : `${faltam === 1 ? 'Falta 1 resposta' : `Faltam ${faltam} respostas`} para liberar seu plano`,
      descricao: `O StudyAI precisa de ${minimoRespostas} respostas para montar um plano com base real.`,
      rotulo: 'Responder questões',
      rota: `/conteudos/${estado.conteudo_com_questoes_id}/questoes`
    };
  }

  return {
    etapa: 'pronto',
    titulo: 'Seu plano está ativo',
    descricao: 'O StudyAI já tem dados suficientes para recomendar o que estudar.',
    rotulo: 'Ver meu plano',
    rota: '/plano'
  };
}

function montarTrilha(etapaAtual) {
  const indiceAtual = ETAPAS.indexOf(etapaAtual);

  return ETAPAS.map((etapa, indice) => ({
    etapa,
    rotulo: ROTULO_DA_ETAPA[etapa],
    concluida: indiceAtual === -1 || indice < indiceAtual,
    atual: indice === indiceAtual
  }));
}

async function getProximoPasso({ usuarioId }) {
  const minimoRespostas = analiseDesempenhoService.MINIMO_RESPOSTAS_GERAL;
  const estado = await jornadaRepository.getEstadoDaConta(usuarioId);
  const passo = montarPasso(estado, minimoRespostas);

  return toProximoPassoResponseDto({
    passo,
    trilha: montarTrilha(passo.etapa),
    estado,
    minimoRespostas
  });
}

module.exports = {
  getProximoPasso,
  montarPasso,
  montarTrilha,
  ETAPAS
};
