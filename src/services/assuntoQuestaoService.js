const questaoRepository = require('../repositories/questaoRepository');
const iaService = require('./iaService');
const { assuntosQuestoesPrompt } = require('./iaPrompts');
const { normalizarAssunto } = require('../dtos/assuntoInputDto');

function mapearAssuntosValidos(payload, questoes) {
  const idsEsperados = new Set(questoes.map((questao) => questao.id));
  const assuntos = new Map();

  if (!payload || !Array.isArray(payload.assuntos)) {
    return assuntos;
  }

  for (const item of payload.assuntos) {
    const questaoId = Number(item?.questao_id);
    const assunto = normalizarAssunto(item?.assunto);
    if (idsEsperados.has(questaoId) && assunto && !assuntos.has(questaoId)) {
      assuntos.set(questaoId, assunto);
    }
  }

  return assuntos;
}

async function classificarConteudo(conteudo) {
  const questoes = await questaoRepository.findSemAssuntoByConteudoId(conteudo.id);
  if (questoes.length === 0) {
    return { classificadas: 0, sem_assunto: 0 };
  }

  const { systemInstruction, prompt } = assuntosQuestoesPrompt(conteudo, questoes);
  const payload = await iaService.generateJson({ systemInstruction, prompt, temperature: 0.2 });
  const assuntos = mapearAssuntosValidos(payload, questoes);

  for (const [id, assunto] of assuntos) {
    await questaoRepository.updateAssunto({ id, assunto });
  }

  return {
    classificadas: assuntos.size,
    sem_assunto: questoes.length - assuntos.size
  };
}

async function classificarQuestoesSemAssunto({ onProgresso } = {}) {
  const conteudos = await questaoRepository.findConteudosComQuestoesSemAssunto();
  const relatorio = { conteudos: conteudos.length, classificadas: 0, sem_assunto: 0, falhas: [] };

  for (const conteudo of conteudos) {
    try {
      const resultado = await classificarConteudo(conteudo);
      relatorio.classificadas += resultado.classificadas;
      relatorio.sem_assunto += resultado.sem_assunto;
      onProgresso?.({ conteudo, ...resultado });
    } catch (error) {
      relatorio.falhas.push({ conteudo_id: conteudo.id, erro: error.message });
      onProgresso?.({ conteudo, erro: error.message });
    }
  }

  return relatorio;
}

module.exports = {
  mapearAssuntosValidos,
  classificarQuestoesSemAssunto
};
