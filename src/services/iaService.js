const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('../config/env');
const AppError = require('../config/appError');

let cachedClient = null;

function getClient() {
  if (!env.geminiApiKey) {
    throw new AppError('GEMINI_API_KEY nao configurada no ambiente', 500);
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(env.geminiApiKey);
  }

  return cachedClient;
}

function extractJsonPayload(text) {
  if (typeof text !== 'string') {
    throw new AppError('Resposta da IA em formato inesperado', 502);
  }

  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;

  const trimmed = candidate.trim();
  const firstBracket = trimmed.search(/[{\[]/);

  if (firstBracket === -1) {
    throw new AppError('Resposta da IA nao contem JSON', 502);
  }

  const jsonSlice = trimmed.slice(firstBracket);

  try {
    return JSON.parse(jsonSlice);
  } catch (error) {
    throw new AppError('Falha ao interpretar JSON retornado pela IA', 502);
  }
}

function mapProviderError(error) {
  const status = error?.status || error?.response?.status;
  const message = error?.message || 'Erro desconhecido na IA';

  if (status === 401 || status === 403) {
    return new AppError('Chave da API de IA invalida ou sem permissao', 502);
  }

  if (status === 429) {
    return new AppError('Limite de requisicoes da IA excedido. Tente novamente em instantes', 429);
  }

  if (status && status >= 500) {
    return new AppError('Provedor de IA indisponivel no momento', 502);
  }

  return new AppError(`Falha ao consultar IA: ${message}`, 502);
}

async function generateJson({ prompt, systemInstruction, temperature = 0.4 }) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction,
    generationConfig: {
      temperature,
      responseMimeType: 'application/json'
    }
  });

  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();
    return extractJsonPayload(text);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw mapProviderError(error);
  }
}

module.exports = {
  generateJson,
  extractJsonPayload,
  mapProviderError
};
