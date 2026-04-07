import { api } from './api';

async function register(payload) {
  return api.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function login(payload) {
  return api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export const authService = {
  register,
  login
};
