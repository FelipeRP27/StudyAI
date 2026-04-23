const flashcardRepository = require('../repositories/flashcardRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const iaService = require('./iaService');
const { flashcardsPrompt } = require('./iaPrompts');
const AppError = require('../config/appError');
const {
  toFlashcardResponseDto,
  toFlashcardListResponseDto
} = require('../dtos/flashcardOutputDto');

async function create(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const flashcard = await flashcardRepository.create(input);
  return toFlashcardResponseDto(flashcard);
}

async function listByConteudo(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);
  const flashcards = await flashcardRepository.findAllByConteudoId(input.conteudoId);
  return toFlashcardListResponseDto(flashcards);
}

async function generateFromConteudo({ conteudoId, usuarioId, quantidade = 8 }) {
  const conteudo = await conteudoOwnershipService.ensureConteudoOwnership(conteudoId, usuarioId);

  const { systemInstruction, prompt } = flashcardsPrompt(conteudo, quantidade);
  const payload = await iaService.generateJson({ systemInstruction, prompt });

  if (!payload || !Array.isArray(payload.flashcards) || payload.flashcards.length === 0) {
    throw new AppError('IA nao retornou flashcards validos', 502);
  }

  const criados = [];
  for (const flashcard of payload.flashcards) {
    if (
      !flashcard ||
      typeof flashcard.frente !== 'string' ||
      typeof flashcard.verso !== 'string' ||
      !flashcard.frente.trim() ||
      !flashcard.verso.trim()
    ) {
      continue;
    }

    const criado = await flashcardRepository.create({
      conteudoId,
      frente: flashcard.frente.trim(),
      verso: flashcard.verso.trim()
    });
    criados.push(criado);
  }

  if (criados.length === 0) {
    throw new AppError('Nenhum flashcard valido foi gerado', 502);
  }

  return toFlashcardListResponseDto(criados);
}

module.exports = {
  create,
  listByConteudo,
  generateFromConteudo
};
