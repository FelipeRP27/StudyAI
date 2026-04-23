const conteudoService = require('../services/conteudoService');
const {
  buildCreateConteudoInputDto,
  buildConteudoMateriaParamsDto,
  buildConteudoParamsDto
} = require('../dtos/conteudoInputDto');

async function create(req, res, next) {
  try {
    const input = buildCreateConteudoInputDto(req.body, req.user.id);
    const output = await conteudoService.create(input);

    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByMateria(req, res, next) {
  try {
    const params = buildConteudoMateriaParamsDto(req.params);
    const output = await conteudoService.listByMateria({
      materiaId: params.materiaId,
      usuarioId: req.user.id
    });

    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function findById(req, res, next) {
  try {
    const params = buildConteudoParamsDto(req.params);
    const output = await conteudoService.findById({
      id: params.id,
      usuarioId: req.user.id
    });

    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  listByMateria,
  findById
};
