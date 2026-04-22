const resumoRepository = require('../repositories/resumoRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const iaService = require('./iaService');
const { resumoPrompt } = require('./iaPrompts');
const AppError = require('../config/appError');
const {
  toResumoResponseDto,
  toResumoListResponseDto
} = require('../dtos/resumoOutputDto');

async function create(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const resumo = await resumoRepository.create(input);
  return toResumoResponseDto(resumo);
}

async function listByConteudo(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const resumos = await resumoRepository.findAllByConteudoId(input.conteudoId);
  return toResumoListResponseDto(resumos);
}

async function generateFromConteudo({ conteudoId, usuarioId }) {
  const conteudo = await conteudoOwnershipService.ensureConteudoOwnership(conteudoId, usuarioId);

  const { systemInstruction, prompt } = resumoPrompt(conteudo);
  const payload = await iaService.generateJson({ systemInstruction, prompt });

  if (!payload || typeof payload.resumo !== 'string' || !payload.resumo.trim()) {
    throw new AppError('IA nao retornou um resumo valido', 502);
  }

  const resumo = await resumoRepository.create({
    conteudoId,
    texto: payload.resumo.trim()
  });

  return toResumoResponseDto(resumo);
}

module.exports = {
  create,
  listByConteudo,
  generateFromConteudo
};
