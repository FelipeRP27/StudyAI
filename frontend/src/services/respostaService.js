import { api } from './api';

async function responder({ questao_id, alternativa_id }) {
  return api.request('/respostas', {
    method: 'POST',
    body: JSON.stringify({ questao_id, alternativa_id })
  });
}

async function listByQuestao(questaoId) {
  return api.request(`/respostas/questao/${questaoId}`);
}

export const respostaService = {
  responder,
  listByQuestao
};
