const flashcardService = require('../services/flashcardService');
const {
  buildCreateFlashcardInputDto,
  buildFlashcardConteudoParamsDto,
  buildFlashcardParamsDto
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

async function marcarRevisado(req, res, next) {
  try {
    const params = buildFlashcardParamsDto(req.params);
    const output = await flashcardService.marcarRevisado({
      flashcardId: params.id,
      usuarioId: req.user.id
    });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function desmarcarRevisado(req, res, next) {
  try {
    const params = buildFlashcardParamsDto(req.params);
    await flashcardService.desmarcarRevisado({
      flashcardId: params.id,
      usuarioId: req.user.id
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  listByConteudo,
  marcarRevisado,
  desmarcarRevisado
};
