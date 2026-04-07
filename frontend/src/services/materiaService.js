import { api } from './api';

async function listMaterias() {
  return api.request('/materias');
}

export const materiaService = {
  listMaterias
};
