import { api } from './api';

async function listAll() {
  return api.request('/tarefas');
}

async function create({ titulo, descricao, data_limite, materia_id }) {
  return api.request('/tarefas', {
    method: 'POST',
    body: JSON.stringify({ titulo, descricao, data_limite, materia_id })
  });
}

async function update(id, { titulo, descricao, data_limite, materia_id }) {
  return api.request(`/tarefas/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ titulo, descricao, data_limite, materia_id })
  });
}

async function setStatus(id, status) {
  return api.request(`/tarefas/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

async function remove(id) {
  return api.request(`/tarefas/${id}`, {
    method: 'DELETE'
  });
}

export const tarefaService = {
  listAll,
  create,
  update,
  setStatus,
  remove
};
