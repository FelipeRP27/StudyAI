import { api } from './api';

async function listByConteudo(conteudoId) {
  return api.request(`/resumos/conteudo/${conteudoId}`);
}

export const resumoService = {
  listByConteudo
};
