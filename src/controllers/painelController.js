const painelService = require('../services/painelService');

async function get(req, res, next) {
  try {
    const output = await painelService.getPainel({ usuarioId: req.user.id });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  get
};
