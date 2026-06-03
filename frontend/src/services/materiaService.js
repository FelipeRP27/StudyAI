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

async function update(id, { nome, descricao }) {
  return api.request(`/materias/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nome, descricao })
  });
}

async function remove(id) {
  return api.request(`/materias/${id}`, {
    method: 'DELETE'
  });
}

export const materiaService = {
  listMaterias,
  create,
  update,
  remove
};
