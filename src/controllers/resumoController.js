const resumoService = require('../services/resumoService');
const {
  buildCreateResumoInputDto,
  buildResumoConteudoParamsDto
} = require('../dtos/resumoInputDto');

async function create(req, res, next) {
  try {
    const input = buildCreateResumoInputDto(req.body, req.user.id);
    const output = await resumoService.create(input);
    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByConteudo(req, res, next) {
  try {
    const params = buildResumoConteudoParamsDto(req.params);
    const output = await resumoService.listByConteudo({
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
