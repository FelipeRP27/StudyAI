const processamentoRepository = require('../repositories/processamentoRepository');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const resumoService = require('./resumoService');
const pontoChaveService = require('./pontoChaveService');
const questaoService = require('./questaoService');
const flashcardService = require('./flashcardService');
const AppError = require('../config/appError');
const {
  toProcessamentoResponseDto,
  toProcessamentoListResponseDto
} = require('../dtos/processamentoOutputDto');

const GERADORES = {
  resumo: (input) => resumoService.generateFromConteudo(input),
  pontos_chave: (input) => pontoChaveService.generateFromConteudo(input),
  questoes: (input) => questaoService.generateFromConteudo(input),
  flashcards: (input) => flashcardService.generateFromConteudo(input)
};

const TIPOS_DISPONIVEIS = Object.keys(GERADORES);

async function runSingle({ conteudoId, usuarioId, tipo }) {
  if (!GERADORES[tipo]) {
    throw new AppError(`Tipo de geracao invalido: ${tipo}`, 400);
  }

  const processamento = await processamentoRepository.create({ conteudoId, usuarioId, tipo });

  try {
    const resultado = await GERADORES[tipo]({ conteudoId, usuarioId });
    await processamentoRepository.markConcluido(processamento.id);
    return { tipo, status: 'concluido', resultado };
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'erro desconhecido';
    await processamentoRepository.markErro(processamento.id, mensagem);
    return {
      tipo,
      status: 'erro',
      erro: mensagem,
      statusCode: error?.statusCode || 502
    };
  }
}

async function processarConteudo({ conteudoId, usuarioId, tipos }) {
  await conteudoOwnershipService.ensureConteudoOwnership(conteudoId, usuarioId);

  const tiposAlvo = Array.isArray(tipos) && tipos.length > 0 ? tipos : TIPOS_DISPONIVEIS;

  const processamento = await processamentoRepository.create({
    conteudoId,
    usuarioId,
    tipo: 'completo'
  });

  const resultados = {};
  const errosTipos = [];

  for (const tipo of tiposAlvo) {
    const { resultado, status, erro } = await runSingle({ conteudoId, usuarioId, tipo });
    resultados[tipo] = { status, ...(resultado ? { dados: resultado } : {}), ...(erro ? { erro } : {}) };
    if (status === 'erro') {
      errosTipos.push(tipo);
    }
  }

  if (errosTipos.length === tiposAlvo.length) {
    await processamentoRepository.markErro(
      processamento.id,
      `Todas as geracoes falharam: ${errosTipos.join(', ')}`
    );
  } else {
    await processamentoRepository.markConcluido(processamento.id);
  }

  return {
    conteudo_id: conteudoId,
    processamento_id: processamento.id,
    tipos_executados: tiposAlvo,
    tipos_com_erro: errosTipos,
    resultados
  };
}

async function listByConteudo({ conteudoId, usuarioId }) {
  await conteudoOwnershipService.ensureConteudoOwnership(conteudoId, usuarioId);
  const processamentos = await processamentoRepository.findAllByConteudoId(conteudoId);
  return toProcessamentoListResponseDto(processamentos);
}

module.exports = {
  processarConteudo,
  listByConteudo,
  TIPOS_DISPONIVEIS,
  toProcessamentoResponseDto
};
