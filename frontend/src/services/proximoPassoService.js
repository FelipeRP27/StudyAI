import { api } from './api';

async function get() {
  return api.request('/proximo-passo');
}

export const proximoPassoService = {
  get
};
