import { api } from './api';

async function listByConteudo(conteudoId) {
  return api.request(`/flashcards/conteudo/${conteudoId}`);
}

async function marcarRevisado(flashcardId) {
  return api.request(`/flashcards/${flashcardId}/revisado`, {
    method: 'POST'
  });
}

async function desmarcarRevisado(flashcardId) {
  return api.request(`/flashcards/${flashcardId}/revisado`, {
    method: 'DELETE'
  });
}

export const flashcardService = {
  listByConteudo,
  marcarRevisado,
  desmarcarRevisado
};
