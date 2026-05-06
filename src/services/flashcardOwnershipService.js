const flashcardRepository = require('../repositories/flashcardRepository');
const AppError = require('../config/appError');

async function ensureFlashcardOwnership(flashcardId, usuarioId) {
  const flashcard = await flashcardRepository.findByIdAndUserId(flashcardId, usuarioId);

  if (!flashcard) {
    throw new AppError('Flashcard not found', 404);
  }

  return flashcard;
}

module.exports = {
  ensureFlashcardOwnership
};
