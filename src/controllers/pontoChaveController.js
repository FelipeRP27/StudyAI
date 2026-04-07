const pontoChaveService = require('../services/pontoChaveService');
const {
  buildCreatePontoChaveInputDto,
  buildPontoChaveConteudoParamsDto
} = require('../dtos/pontoChaveInputDto');

async function create(req, res, next) {
  try {
    const input = buildCreatePontoChaveInputDto(req.body, req.user.id);
    const output = await pontoChaveService.create(input);
    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByConteudo(req, res, next) {
  try {
    const params = buildPontoChaveConteudoParamsDto(req.params);
    const output = await pontoChaveService.listByConteudo({
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
