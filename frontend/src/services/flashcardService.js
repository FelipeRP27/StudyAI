import { api } from './api';

async function listByConteudo(conteudoId) {
  return api.request(`/flashcards/conteudo/${conteudoId}`);
}

export const flashcardService = {
  listByConteudo
};
