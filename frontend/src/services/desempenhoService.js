import { api } from './api';

async function get({ dias = 30 } = {}) {
  return api.request(`/desempenho?dias=${dias}`);
}

async function getByMateria(materiaId, { dias = 30 } = {}) {
  return api.request(`/desempenho/materias/${materiaId}?dias=${dias}`);
}

export const desempenhoService = {
  get,
  getByMateria
};
