import { api } from './api';

async function processarConteudo(conteudoId, tipos) {
  const body = tipos ? JSON.stringify({ tipos }) : undefined;
  return api.request(`/processamentos/conteudo/${conteudoId}`, {
    method: 'POST',
    body
  });
}

async function listByConteudo(conteudoId) {
  return api.request(`/processamentos/conteudo/${conteudoId}`);
}

export const processamentoService = {
  processarConteudo,
  listByConteudo
};
