import { api } from './api';

async function registrar({ conteudo_id, tipo }) {
  return api.request('/atividades', {
    method: 'POST',
    body: JSON.stringify({ conteudo_id, tipo })
  });
}

export const atividadeEstudoService = {
  registrar
};
