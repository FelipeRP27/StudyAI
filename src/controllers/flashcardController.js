const flashcardService = require('../services/flashcardService');
const {
  buildCreateFlashcardInputDto,
  buildFlashcardConteudoParamsDto
} = require('../dtos/flashcardInputDto');

async function create(req, res, next) {
  try {
    const input = buildCreateFlashcardInputDto(req.body, req.user.id);
    const output = await flashcardService.create(input);
    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByConteudo(req, res, next) {
  try {
    const params = buildFlashcardConteudoParamsDto(req.params);
    const output = await flashcardService.listByConteudo({
      conteudoId: params.conteudoId,
      usuarioId: req.user.id
    });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  listByConteudo
};
