const planoEstudoService = require('../services/planoEstudoService');

async function get(req, res, next) {
  try {
    const output = await planoEstudoService.getPlanoEstudo({ usuarioId: req.user.id });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  get
};
