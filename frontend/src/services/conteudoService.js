import { api } from './api';

async function listByMateria(materiaId) {
  return api.request(`/conteudos/materia/${materiaId}`);
}

async function getById(id) {
  return api.request(`/conteudos/${id}`);
}

async function create({ titulo, texto, materia_id }) {
  return api.request('/conteudos', {
    method: 'POST',
    body: JSON.stringify({ titulo, texto, materia_id })
  });
}

async function update(id, { titulo, texto }) {
  return api.request(`/conteudos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ titulo, texto })
  });
}

async function remove(id) {
  return api.request(`/conteudos/${id}`, { method: 'DELETE' });
}

export const conteudoService = {
  listByMateria,
  getById,
  create,
  update,
  remove
};
