const planoEstudoService = require('../services/planoEstudoService');
const sessaoEstudoService = require('../services/sessaoEstudoService');
const {
  buildSessaoInputDto,
  buildDiagnosticoInputDto
} = require('../dtos/sessaoEstudoInputDto');

async function get(req, res, next) {
  try {
    const output = await planoEstudoService.getPlanoEstudo({ usuarioId: req.user.id });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function getSessao(req, res, next) {
  try {
    const input = buildSessaoInputDto(
      req.query,
      req.user.id,
      sessaoEstudoService.QUANTIDADE_PADRAO_SESSAO
    );
    const output = await sessaoEstudoService.getSessaoPorConteudo(input);
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function getDiagnostico(req, res, next) {
  try {
    const input = buildDiagnosticoInputDto(
      req.query,
      req.user.id,
      sessaoEstudoService.QUANTIDADE_PADRAO_DIAGNOSTICO
    );
    const output = await sessaoEstudoService.getDiagnostico(input);
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  get,
  getSessao,
  getDiagnostico
};
