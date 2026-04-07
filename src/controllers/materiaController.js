const materiaService = require('../services/materiaService');
const {
  buildCreateMateriaInputDto,
  buildUpdateMateriaInputDto,
  buildMateriaParamsDto
} = require('../dtos/materiaInputDto');

async function create(req, res, next) {
  try {
    const input = buildCreateMateriaInputDto(req.body, req.user.id);
    const output = await materiaService.create(input);

    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByUser(req, res, next) {
  try {
    const output = await materiaService.listByUser(req.user.id);
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const params = buildMateriaParamsDto(req.params);
    const input = buildUpdateMateriaInputDto(req.body, req.user.id, params.id);
    const output = await materiaService.update(input);

    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const params = buildMateriaParamsDto(req.params);
    await materiaService.remove({
      id: params.id,
      usuarioId: req.user.id
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  listByUser,
  update,
  remove
};
