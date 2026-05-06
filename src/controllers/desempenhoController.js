const desempenhoService = require('../services/desempenhoService');

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

module.exports = {
  get
};
