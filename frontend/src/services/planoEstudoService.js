import { api } from './api';

async function get() {
  return api.request('/plano-estudo');
}

export const planoEstudoService = {
  get
};
