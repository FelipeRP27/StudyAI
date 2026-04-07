const questaoService = require('../services/questaoService');
const {
  buildCreateQuestaoInputDto,
  buildQuestaoConteudoParamsDto
} = require('../dtos/questaoInputDto');

async function create(req, res, next) {
  try {
    const input = buildCreateQuestaoInputDto(req.body, req.user.id);
    const output = await questaoService.create(input);
    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByConteudo(req, res, next) {
  try {
    const params = buildQuestaoConteudoParamsDto(req.params);
    const output = await questaoService.listByConteudo({
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
