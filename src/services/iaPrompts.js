const SYSTEM_BASE =
  'Voce e um assistente educacional especializado em concursos publicos brasileiros. ' +
  'Responda SEMPRE em portugues do Brasil, de forma clara, objetiva e factualmente fiel ao conteudo fornecido. ' +
  'Responda SEMPRE em formato JSON valido, sem texto fora do JSON.';

function buildConteudoContext(conteudo) {
  return `Titulo: ${conteudo.titulo}\n\nConteudo:\n${conteudo.texto}`;
}

const resumoPrompt = (conteudo) => ({
  systemInstruction: SYSTEM_BASE,
  prompt:
    'Gere um resumo do conteudo abaixo com 4 a 8 paragrafos curtos, cobrindo os pontos principais sem omitir conceitos ' +
    'importantes para provas.\n\n' +
    `${buildConteudoContext(conteudo)}\n\n` +
    'Retorne exclusivamente este JSON:\n' +
    '{ "resumo": "<texto do resumo>" }'
});

const pontosChavePrompt = (conteudo) => ({
  systemInstruction: SYSTEM_BASE,
  prompt:
    'Extraia entre 5 e 10 pontos-chave do conteudo abaixo. Cada ponto deve ser uma frase curta e direta, ' +
    'cobrindo um conceito distinto cobrado em concursos.\n\n' +
    `${buildConteudoContext(conteudo)}\n\n` +
    'Retorne exclusivamente este JSON:\n' +
    '{ "pontos_chave": ["<ponto 1>", "<ponto 2>", "..."] }'
});

const questoesPrompt = (conteudo, quantidade = 5) => ({
  systemInstruction: SYSTEM_BASE,
  prompt:
    `Gere ${quantidade} questoes de multipla escolha sobre o conteudo abaixo, estilo concurso publico. ` +
    'Cada questao deve ter exatamente 4 alternativas, com APENAS UMA correta. ' +
    'As alternativas incorretas devem ser plausiveis, nao absurdas. ' +
    'IMPORTANTE: para CADA alternativa (correta ou errada), inclua tambem o campo "justificativa": ' +
    'na alternativa correta, explique por que ela esta certa; nas alternativas erradas, explique especificamente ' +
    'qual o erro de cada uma (conceito confundido, dado incorreto, exceção mal aplicada, etc). ' +
    'A justificativa deve ter de 1 a 3 frases, em portugues do Brasil, conectada ao conteudo fornecido.\n\n' +
    `${buildConteudoContext(conteudo)}\n\n` +
    'Retorne exclusivamente este JSON:\n' +
    '{\n' +
    '  "questoes": [\n' +
    '    {\n' +
    '      "enunciado": "<texto da questao>",\n' +
    '      "alternativas": [\n' +
    '        { "texto": "<alternativa A>", "is_correta": false, "justificativa": "<por que A esta errada>" },\n' +
    '        { "texto": "<alternativa B>", "is_correta": true, "justificativa": "<por que B esta correta>" },\n' +
    '        { "texto": "<alternativa C>", "is_correta": false, "justificativa": "<por que C esta errada>" },\n' +
    '        { "texto": "<alternativa D>", "is_correta": false, "justificativa": "<por que D esta errada>" }\n' +
    '      ]\n' +
    '    }\n' +
    '  ]\n' +
    '}'
});

const flashcardsPrompt = (conteudo, quantidade = 8) => ({
  systemInstruction: SYSTEM_BASE,
  prompt:
    `Gere ${quantidade} flashcards de estudo ativo sobre o conteudo abaixo. ` +
    'Cada flashcard deve ter uma pergunta curta na "frente" e a resposta objetiva no "verso".\n\n' +
    `${buildConteudoContext(conteudo)}\n\n` +
    'Retorne exclusivamente este JSON:\n' +
    '{\n' +
    '  "flashcards": [\n' +
    '    { "frente": "<pergunta>", "verso": "<resposta>" }\n' +
    '  ]\n' +
    '}'
});

module.exports = {
  resumoPrompt,
  pontosChavePrompt,
  questoesPrompt,
  flashcardsPrompt
};
