import { api } from './api';

async function listByConteudo(conteudoId) {
  return api.request(`/questoes/conteudo/${conteudoId}`);
}

export const questaoService = {
  listByConteudo
};
