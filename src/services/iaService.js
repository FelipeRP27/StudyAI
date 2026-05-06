const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('../config/env');
const AppError = require('../config/appError');

const MAX_TENTATIVAS = 3;
const ATRASO_INICIAL_MS = 1000;

let cachedClient = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error) {
  const status = error?.status || error?.response?.status;
  return status === 429 || (status && status >= 500);
}

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

  let ultimoErro;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa += 1) {
    try {
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.();
      return extractJsonPayload(text);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      ultimoErro = error;
      console.error('[iaService] erro do provedor:', {
        tentativa,
        status: error?.status || error?.response?.status,
        message: error?.message,
        model: env.geminiModel
      });
      if (!isRetryable(error) || tentativa === MAX_TENTATIVAS) {
        break;
      }
      await sleep(ATRASO_INICIAL_MS * 2 ** (tentativa - 1));
    }
  }

  throw mapProviderError(ultimoErro);
}

module.exports = {
  generateJson,
  extractJsonPayload,
  mapProviderError
};
