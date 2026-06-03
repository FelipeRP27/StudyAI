const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
let authToken = null;
let onUnauthorized = null;

function setAuthToken(token) {
  authToken = token || null;
}

function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function buildFriendlyMessage(status, body) {
  if (status === 401) return 'Sessão expirada. Faça login novamente.';
  if (status === 403) return 'Você não tem permissão para esta ação.';
  if (status === 404) return body?.message || 'Recurso não encontrado.';
  if (status === 429) return 'Muitas tentativas. Aguarde alguns instantes.';
  if (status >= 500) return body?.message || 'Serviço indisponível no momento. Tente novamente.';
  return body?.message || 'Erro ao processar a requisição.';
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers,
      ...options
    });
  } catch (networkError) {
    const err = new Error('Sem conexão com o servidor. Verifique sua internet ou se o backend está no ar.');
    err.isNetworkError = true;
    throw err;
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const err = new Error(buildFriendlyMessage(response.status, body));
    err.status = response.status;
    throw err;
  }

  return body;
}

export const api = {
  request,
  setAuthToken,
  setUnauthorizedHandler
};
