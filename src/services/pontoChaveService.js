const pontoChaveRepository = require('../repositories/pontoChaveRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const iaService = require('./iaService');
const { pontosChavePrompt } = require('./iaPrompts');
const AppError = require('../config/appError');
const {
  toPontoChaveResponseDto,
  toPontoChaveListResponseDto
} = require('../dtos/pontoChaveOutputDto');

async function create(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const pontoChave = await pontoChaveRepository.create(input);
  return toPontoChaveResponseDto(pontoChave);
}

async function listByConteudo(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const pontosChave = await pontoChaveRepository.findAllByConteudoId(input.conteudoId);
  return toPontoChaveListResponseDto(pontosChave);
}

async function generateFromConteudo({ conteudoId, usuarioId }) {
  const conteudo = await conteudoOwnershipService.ensureConteudoOwnership(conteudoId, usuarioId);

  const { systemInstruction, prompt } = pontosChavePrompt(conteudo);
  const payload = await iaService.generateJson({ systemInstruction, prompt });

  if (!payload || !Array.isArray(payload.pontos_chave) || payload.pontos_chave.length === 0) {
    throw new AppError('IA nao retornou pontos-chave validos', 502);
  }

  const criados = [];
  for (const texto of payload.pontos_chave) {
    if (typeof texto !== 'string' || !texto.trim()) {
      continue;
    }
    const pontoChave = await pontoChaveRepository.create({
      conteudoId,
      texto: texto.trim()
    });
    criados.push(pontoChave);
  }

  if (criados.length === 0) {
    throw new AppError('Nenhum ponto-chave valido foi gerado', 502);
  }

  return toPontoChaveListResponseDto(criados);
}

module.exports = {
  create,
  listByConteudo,
  generateFromConteudo
};
