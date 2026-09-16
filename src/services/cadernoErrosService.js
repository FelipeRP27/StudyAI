const cadernoErrosRepository = require('../repositories/cadernoErrosRepository');
const questaoRepository = require('../repositories/questaoRepository');
const materiaOwnershipService = require('./materiaOwnershipService');
const conteudoOwnershipService = require('./conteudoOwnershipService');
const {
  toCadernoErrosResponseDto,
  toCadernoErrosResumoResponseDto
} = require('../dtos/cadernoErrosOutputDto');

function classificarStatus(linha) {
  return linha.ultima_resposta_correta ? 'revisado' : 'pendente';
}

function contar(itens) {
  return itens.reduce(
    (contagem, item) => ({
      questoes: contagem.questoes + 1,
      pendentes: contagem.pendentes + (item.status === 'pendente' ? 1 : 0),
      revisadas: contagem.revisadas + (item.status === 'revisado' ? 1 : 0),
      total_erros: contagem.total_erros + item.total_erros
    }),
    { questoes: 0, pendentes: 0, revisadas: 0, total_erros: 0 }
  );
}

function agrupar(itens, chave, campos) {
  const grupos = new Map();

  for (const item of itens) {
    const id = chave(item);
    if (!grupos.has(id)) {
      grupos.set(id, { campos: campos(item), itens: [] });
    }
    grupos.get(id).itens.push(item);
  }

  return [...grupos.values()]
    .map((grupo) => ({ ...grupo.campos, ...contar(grupo.itens) }))
    .sort((a, b) => b.total_erros - a.total_erros || b.pendentes - a.pendentes);
}

async function carregarItens({ usuarioId, materiaId = null, conteudoId = null }) {
  const linhas = await cadernoErrosRepository.findErrosByUsuario({ usuarioId, materiaId, conteudoId });
  return linhas.map((linha) => ({ ...linha, status: classificarStatus(linha) }));
}

async function listar({ usuarioId, materiaId, conteudoId, status }) {
  if (materiaId) {
    await materiaOwnershipService.ensureMateriaOwnership(materiaId, usuarioId);
  }
  if (conteudoId) {
    await conteudoOwnershipService.ensureConteudoOwnership(conteudoId, usuarioId);
  }

  const itens = await carregarItens({ usuarioId, materiaId, conteudoId });
  const filtrados = status ? itens.filter((item) => item.status === status) : itens;

  const alternativas = await questaoRepository.findAlternativasByQuestaoIds(
    filtrados.map((item) => item.questao_id)
  );

  const itensComAlternativas = filtrados.map((item) => ({
    ...item,
    alternativas: alternativas.filter((alternativa) => alternativa.questao_id === item.questao_id)
  }));

  return toCadernoErrosResponseDto({ contagem: contar(itens), itens: itensComAlternativas });
}

async function resumir({ usuarioId }) {
  const itens = await carregarItens({ usuarioId });

  return toCadernoErrosResumoResponseDto({
    contagem: contar(itens),
    porMateria: agrupar(
      itens,
      (item) => item.materia_id,
      (item) => ({ materia_id: item.materia_id, materia_nome: item.materia_nome })
    ),
    porConteudo: agrupar(
      itens,
      (item) => item.conteudo_id,
      (item) => ({
        conteudo_id: item.conteudo_id,
        conteudo_titulo: item.conteudo_titulo,
        materia_id: item.materia_id,
        materia_nome: item.materia_nome
      })
    ),
    porAssunto: agrupar(
      itens,
      (item) => `${item.materia_id}:${item.assunto ?? ''}`,
      (item) => ({
        assunto: item.assunto ?? null,
        materia_id: item.materia_id,
        materia_nome: item.materia_nome
      })
    )
  });
}

module.exports = {
  listar,
  resumir,
  classificarStatus
};
