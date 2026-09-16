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
    'A justificativa deve ter de 1 a 3 frases, em portugues do Brasil, conectada ao conteudo fornecido. ' +
    'Inclua tambem em cada questao o campo "assunto": o topico especifico cobrado, com 2 a 6 palavras ' +
    '(ex.: "Anulacao e revogacao"), mais especifico que o titulo do conteudo. ' +
    'Questoes sobre o mesmo topico devem usar exatamente o mesmo assunto.\n\n' +
    `${buildConteudoContext(conteudo)}\n\n` +
    'Retorne exclusivamente este JSON:\n' +
    '{\n' +
    '  "questoes": [\n' +
    '    {\n' +
    '      "enunciado": "<texto da questao>",\n' +
    '      "assunto": "<topico especifico da questao>",\n' +
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

const assuntosQuestoesPrompt = (conteudo, questoes) => ({
  systemInstruction: SYSTEM_BASE,
  prompt:
    'Classifique cada questao abaixo pelo assunto especifico que ela cobra dentro do conteudo. ' +
    'O assunto deve ter de 2 a 6 palavras (ex.: "Anulacao e revogacao") e ser mais especifico que o titulo do conteudo. ' +
    'Questoes sobre o mesmo topico devem receber exatamente o mesmo assunto.\n\n' +
    `${buildConteudoContext(conteudo)}\n\n` +
    'Questoes:\n' +
    questoes.map((questao) => `[id ${questao.id}] ${questao.enunciado}`).join('\n') +
    '\n\nRetorne exclusivamente este JSON, com um item por questao:\n' +
    '{ "assuntos": [ { "questao_id": <id>, "assunto": "<assunto>" } ] }'
});

module.exports = {
  resumoPrompt,
  pontosChavePrompt,
  questoesPrompt,
  flashcardsPrompt,
  assuntosQuestoesPrompt
};
