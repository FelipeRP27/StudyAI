import { api } from './api';

async function listMaterias() {
  return api.request('/materias');
}

async function create({ nome, descricao }) {
  return api.request('/materias', {
    method: 'POST',
    body: JSON.stringify({ nome, descricao })
  });
}

export const materiaService = {
  listMaterias,
  create
};
