const respostaService = require('../services/respostaService');
const {
  buildResponderInputDto,
  buildRespostaQuestaoParamsDto
} = require('../dtos/respostaInputDto');

async function responder(req, res, next) {
  try {
    const input = buildResponderInputDto(req.body, req.user.id);
    const output = await respostaService.responder(input);
    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function listByQuestao(req, res, next) {
  try {
    const params = buildRespostaQuestaoParamsDto(req.params);
    const output = await respostaService.listByQuestao({
      questaoId: params.questaoId,
      usuarioId: req.user.id
    });
    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  responder,
  listByQuestao
};
