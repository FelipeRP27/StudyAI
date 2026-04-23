import { api } from './api';

async function listByConteudo(conteudoId) {
  return api.request(`/pontos-chave/conteudo/${conteudoId}`);
}

export const pontoChaveService = {
  listByConteudo
};
