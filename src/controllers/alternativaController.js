const alternativaService = require('../services/alternativaService');
const {
  buildCreateAlternativaInputDto,
  buildAlternativaQuestaoParamsDto
} = require('../dtos/alternativaInputDto');

async function create(req, res, next) {
  try {
    const input = buildCreateAlternativaInputDto(req.body, req.user.id);
    const output = await alternativaService.create(input);
    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByQuestao(req, res, next) {
  try {
    const params = buildAlternativaQuestaoParamsDto(req.params);
    const output = await alternativaService.listByQuestao({
      questaoId: params.questaoId,
      usuarioId: req.user.id
    });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  listByQuestao
};
