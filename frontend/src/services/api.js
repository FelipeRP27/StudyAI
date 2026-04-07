const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
let authToken = null;

function setAuthToken(token) {
  authToken = token || null;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers,
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(body?.message || 'Erro ao processar a requisicao');
  }

  return body;
}

export const api = {
  request,
  setAuthToken
};
