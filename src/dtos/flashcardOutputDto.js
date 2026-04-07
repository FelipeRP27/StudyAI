function toFlashcardResponseDto(flashcard) {
  return {
    id: flashcard.id,
    conteudo_id: flashcard.conteudo_id,
    frente: flashcard.frente,
    verso: flashcard.verso,
    created_at: flashcard.created_at
  };
}

function toFlashcardListResponseDto(flashcards) {
  return flashcards.map(toFlashcardResponseDto);
}

module.exports = {
  toFlashcardResponseDto,
  toFlashcardListResponseDto
};
