const tarefaService = require('../services/tarefaService');
const {
  buildCreateTarefaInputDto,
  buildUpdateTarefaInputDto,
  buildTarefaParamsDto,
  buildSetStatusInputDto
} = require('../dtos/tarefaInputDto');

async function create(req, res, next) {
  try {
    const input = buildCreateTarefaInputDto(req.body, req.user.id);
    const output = await tarefaService.create(input);
    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByUser(req, res, next) {
  try {
    const output = await tarefaService.listByUser(req.user.id);
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const params = buildTarefaParamsDto(req.params);
    const input = buildUpdateTarefaInputDto(req.body, req.user.id, params.id);
    const output = await tarefaService.update(input);
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function setStatus(req, res, next) {
  try {
    const params = buildTarefaParamsDto(req.params);
    const { status } = buildSetStatusInputDto(req.body);
    const output = await tarefaService.setStatus({
      id: params.id,
      usuarioId: req.user.id,
      status
    });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const params = buildTarefaParamsDto(req.params);
    await tarefaService.remove({
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
  setStatus,
  remove
};
