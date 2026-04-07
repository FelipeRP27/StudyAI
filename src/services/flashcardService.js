const flashcardRepository = require('../repositories/flashcardRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
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

module.exports = {
  create,
  listByConteudo
};
