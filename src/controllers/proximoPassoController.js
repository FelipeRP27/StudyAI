const proximoPassoService = require('../services/proximoPassoService');

async function get(req, res, next) {
  try {
    const output = await proximoPassoService.getProximoPasso({ usuarioId: req.user.id });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  get
};
