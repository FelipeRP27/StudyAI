import { api } from './api';

function montarQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.set(chave, valor);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function listar(filtros) {
  return api.request(`/caderno-erros${montarQuery(filtros)}`);
}

async function resumo() {
  return api.request('/caderno-erros/resumo');
}

export const cadernoErrosService = {
  listar,
  resumo
};
