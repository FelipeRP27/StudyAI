import { api } from './api';

async function get() {
  return api.request('/painel');
}

export const painelService = {
  get
};
