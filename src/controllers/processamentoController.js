const processamentoService = require('../services/processamentoService');
const {
  buildProcessarConteudoInputDto,
  buildProcessamentoConteudoParamsDto
} = require('../dtos/processamentoInputDto');

async function processarConteudo(req, res, next) {
  try {
    const input = buildProcessarConteudoInputDto(req.body || {}, req.params, req.user.id);
    const output = await processamentoService.processarConteudo(input);
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByConteudo(req, res, next) {
  try {
    const params = buildProcessamentoConteudoParamsDto(req.params);
    const output = await processamentoService.listByConteudo({
      conteudoId: params.conteudoId,
      usuarioId: req.user.id
    });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  processarConteudo,
  listByConteudo
};
