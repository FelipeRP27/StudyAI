const questaoRepository = require('../repositories/questaoRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const iaService = require('./iaService');
const { questoesPrompt } = require('./iaPrompts');
const AppError = require('../config/appError');
const {
  toQuestaoResponseDto,
  toQuestaoListResponseDto
} = require('../dtos/questaoOutputDto');

async function attachAlternativas(questoes) {
  const questaoIds = questoes.map((questao) => questao.id);
  const alternativas = await questaoRepository.findAlternativasByQuestaoIds(questaoIds);

  return questoes.map((questao) => ({
    ...questao,
    alternativas: alternativas.filter((alternativa) => alternativa.questao_id === questao.id)
  }));
}

async function create(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);

  const questao = await questaoRepository.create(input);
  const alternativas = [];

  for (const alternativa of input.alternativas) {
    const createdAlternativa = await questaoRepository.createAlternativa({
      questaoId: questao.id,
      texto: alternativa.texto,
      isCorreta: alternativa.is_correta
    });
    alternativas.push(createdAlternativa);
  }

  return toQuestaoResponseDto({
    ...questao,
    alternativas
  });
}

async function listByConteudo(input) {
  await conteudoOwnershipService.ensureConteudoOwnership(input.conteudoId, input.usuarioId);

  const questoes = await questaoRepository.findAllByConteudoId(input.conteudoId);
  const enrichedQuestoes = await attachAlternativas(questoes);

  return toQuestaoListResponseDto(enrichedQuestoes);
}

function validateQuestoesPayload(payload) {
  if (!payload || !Array.isArray(payload.questoes) || payload.questoes.length === 0) {
    throw new AppError('IA nao retornou questoes validas', 502);
  }

  return payload.questoes
    .filter((questao) => questao && typeof questao.enunciado === 'string' && Array.isArray(questao.alternativas))
    .map((questao) => {
      const alternativas = questao.alternativas
        .filter((alt) => alt && typeof alt.texto === 'string' && alt.texto.trim())
        .map((alt) => ({
          texto: alt.texto.trim(),
          is_correta: Boolean(alt.is_correta)
        }));

      const corretas = alternativas.filter((alt) => alt.is_correta).length;

      if (alternativas.length < 2 || corretas !== 1) {
        return null;
      }

      return {
        enunciado: questao.enunciado.trim(),
        alternativas
      };
    })
    .filter(Boolean);
}

async function generateFromConteudo({ conteudoId, usuarioId, quantidade = 5 }) {
  const conteudo = await conteudoOwnershipService.ensureConteudoOwnership(conteudoId, usuarioId);

  const { systemInstruction, prompt } = questoesPrompt(conteudo, quantidade);
  const payload = await iaService.generateJson({ systemInstruction, prompt });
  const questoesValidas = validateQuestoesPayload(payload);

  if (questoesValidas.length === 0) {
    throw new AppError('Nenhuma questao valida foi gerada pela IA', 502);
  }

  const criadas = [];

  for (const questaoData of questoesValidas) {
    const questao = await questaoRepository.create({
      conteudoId,
      enunciado: questaoData.enunciado
    });

    const alternativas = [];
    for (const alternativa of questaoData.alternativas) {
      const createdAlternativa = await questaoRepository.createAlternativa({
        questaoId: questao.id,
        texto: alternativa.texto,
        isCorreta: alternativa.is_correta
      });
      alternativas.push(createdAlternativa);
    }

    criadas.push({ ...questao, alternativas });
  }

  return toQuestaoListResponseDto(criadas);
}

module.exports = {
  create,
  listByConteudo,
  generateFromConteudo
};
