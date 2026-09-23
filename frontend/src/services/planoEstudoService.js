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

async function get() {
  return api.request('/plano-estudo');
}

async function sessao({ conteudo_id, quantidade }) {
  return api.request(`/plano-estudo/sessao${montarQuery({ conteudo_id, quantidade })}`);
}

async function diagnostico({ quantidade } = {}) {
  return api.request(`/plano-estudo/diagnostico${montarQuery({ quantidade })}`);
}

export const planoEstudoService = {
  get,
  sessao,
  diagnostico
};
