const desempenhoService = require('../services/desempenhoService');
const AppError = require('../config/appError');

async function get(req, res, next) {
  try {
    const dias = Number(req.query.dias) || 30;
    const output = await desempenhoService.getDesempenho({
      usuarioId: req.user.id,
      dias
    });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function getByMateria(req, res, next) {
  try {
    const materiaId = Number(req.params.materiaId);
    if (!Number.isInteger(materiaId) || materiaId <= 0) {
      throw new AppError('valid materiaId is required', 400);
    }
    const dias = Number(req.query.dias) || 30;
    const output = await desempenhoService.getDesempenhoPorMateria({
      materiaId,
      usuarioId: req.user.id,
      dias
    });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  get,
  getByMateria
};
