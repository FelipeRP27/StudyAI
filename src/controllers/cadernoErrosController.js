const cadernoErrosService = require('../services/cadernoErrosService');
const { buildListarErrosInputDto } = require('../dtos/cadernoErrosInputDto');

async function listar(req, res, next) {
  try {
    const input = buildListarErrosInputDto(req.query, req.user.id);
    const output = await cadernoErrosService.listar(input);
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function resumir(req, res, next) {
  try {
    const output = await cadernoErrosService.resumir({ usuarioId: req.user.id });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  resumir
};
