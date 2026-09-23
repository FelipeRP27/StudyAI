const atividadeEstudoService = require('../services/atividadeEstudoService');
const { buildRegistrarAtividadeInputDto } = require('../dtos/atividadeEstudoInputDto');

async function registrar(req, res, next) {
  try {
    const input = buildRegistrarAtividadeInputDto(req.body, req.user.id);
    const output = await atividadeEstudoService.registrar(input);
    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registrar
};
