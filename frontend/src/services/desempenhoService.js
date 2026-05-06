import { api } from './api';

async function get({ dias = 30 } = {}) {
  return api.request(`/desempenho?dias=${dias}`);
}

export const desempenhoService = {
  get
};
