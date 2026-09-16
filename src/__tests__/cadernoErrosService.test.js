jest.mock('../repositories/cadernoErrosRepository', () => ({
  findErrosByUsuario: jest.fn()
}));

jest.mock('../repositories/questaoRepository', () => ({
  findAlternativasByQuestaoIds: jest.fn()
}));

jest.mock('../services/materiaOwnershipService', () => ({
  ensureMateriaOwnership: jest.fn()
}));

jest.mock('../services/conteudoOwnershipService', () => ({
  ensureConteudoOwnership: jest.fn()
}));

const cadernoErrosRepository = require('../repositories/cadernoErrosRepository');
const questaoRepository = require('../repositories/questaoRepository');
const materiaOwnershipService = require('../services/materiaOwnershipService');
const conteudoOwnershipService = require('../services/conteudoOwnershipService');
const cadernoErrosService = require('../services/cadernoErrosService');
const AppError = require('../config/appError');

function linhaErro(sobrescrever) {
  return {
    questao_id: 1,
    enunciado: 'Enunciado',
    assunto: 'Anulacao e revogacao',
    questao_criada_em: '2026-09-01T00:00:00Z',
    conteudo_id: 20,
    conteudo_titulo: 'Atos Administrativos',
    materia_id: 10,
    materia_nome: 'Direito Administrativo',
    total_respostas: 3,
    total_erros: 2,
    ultimo_erro_em: '2026-09-10T00:00:00Z',
    ultima_resposta_em: '2026-09-10T00:00:00Z',
    ultima_resposta_correta: false,
    ...sobrescrever
  };
}

const linhas = [
  linhaErro({ questao_id: 1, total_erros: 3 }),
  linhaErro({ questao_id: 2, assunto: 'Motivacao', total_erros: 1, ultima_resposta_correta: true }),
  linhaErro({
    questao_id: 3,
    assunto: null,
    conteudo_id: 30,
    conteudo_titulo: 'Direitos Fundamentais',
    materia_id: 40,
    materia_nome: 'Direito Constitucional',
    total_erros: 4
  })
];

describe('cadernoErrosService.classificarStatus', () => {
  test('pendente quando a ultima resposta foi errada, revisado quando acertou depois de errar', () => {
    expect(cadernoErrosService.classificarStatus({ ultima_resposta_correta: false })).toBe('pendente');
    expect(cadernoErrosService.classificarStatus({ ultima_resposta_correta: true })).toBe('revisado');
  });
});

describe('cadernoErrosService.listar', () => {
  beforeEach(() => {
    cadernoErrosRepository.findErrosByUsuario.mockResolvedValue(linhas);
    questaoRepository.findAlternativasByQuestaoIds.mockImplementation((ids) =>
      Promise.resolve(
        ids.flatMap((id) => [
          { id: id * 10, questao_id: id, texto: 'certa', is_correta: true, justificativa: 'ok' },
          { id: id * 10 + 1, questao_id: id, texto: 'errada', is_correta: false, justificativa: 'nao' }
        ])
      )
    );
  });

  test('devolve itens com status, alternativas e contagem geral', async () => {
    const output = await cadernoErrosService.listar({ usuarioId: 7 });

    expect(cadernoErrosRepository.findErrosByUsuario).toHaveBeenCalledWith({
      usuarioId: 7,
      materiaId: null,
      conteudoId: null
    });
    expect(materiaOwnershipService.ensureMateriaOwnership).not.toHaveBeenCalled();
    expect(output.resumo).toEqual({ questoes: 3, pendentes: 2, revisadas: 1, total_erros: 8 });
    expect(output.itens.map((item) => item.status)).toEqual(['pendente', 'revisado', 'pendente']);
    expect(output.itens[0].questao).toEqual(
      expect.objectContaining({ id: 1, assunto: 'Anulacao e revogacao' })
    );
    expect(output.itens[0].questao.alternativas).toHaveLength(2);
    expect(output.itens[2].questao.alternativas.every((alt) => alt.questao_id === 3)).toBe(true);
  });

  test('filtra por status sem alterar a contagem das abas', async () => {
    const output = await cadernoErrosService.listar({ usuarioId: 7, status: 'revisado' });

    expect(output.itens).toHaveLength(1);
    expect(output.itens[0].questao.id).toBe(2);
    expect(output.resumo.pendentes).toBe(2);
    expect(questaoRepository.findAlternativasByQuestaoIds).toHaveBeenCalledWith([2]);
  });

  test('valida a propriedade da materia e do conteudo usados como filtro', async () => {
    await cadernoErrosService.listar({ usuarioId: 7, materiaId: 10, conteudoId: 20 });

    expect(materiaOwnershipService.ensureMateriaOwnership).toHaveBeenCalledWith(10, 7);
    expect(conteudoOwnershipService.ensureConteudoOwnership).toHaveBeenCalledWith(20, 7);
    expect(cadernoErrosRepository.findErrosByUsuario).toHaveBeenCalledWith({
      usuarioId: 7,
      materiaId: 10,
      conteudoId: 20
    });
  });

  test('propaga 404 quando o filtro aponta para materia de outro usuario', async () => {
    materiaOwnershipService.ensureMateriaOwnership.mockRejectedValue(
      new AppError('Materia not found', 404)
    );

    await expect(cadernoErrosService.listar({ usuarioId: 7, materiaId: 99 })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(cadernoErrosRepository.findErrosByUsuario).not.toHaveBeenCalled();
  });
});

describe('cadernoErrosService.resumir', () => {
  test('agrupa por materia, conteudo e assunto do mais errado ao menos', async () => {
    cadernoErrosRepository.findErrosByUsuario.mockResolvedValue(linhas);

    const output = await cadernoErrosService.resumir({ usuarioId: 7 });

    expect(output).toEqual(
      expect.objectContaining({ questoes: 3, pendentes: 2, revisadas: 1, total_erros: 8 })
    );
    expect(output.por_materia).toEqual([
      { materia_id: 10, materia_nome: 'Direito Administrativo', questoes: 2, pendentes: 1, revisadas: 1, total_erros: 4 },
      { materia_id: 40, materia_nome: 'Direito Constitucional', questoes: 1, pendentes: 1, revisadas: 0, total_erros: 4 }
    ]);
    expect(output.por_conteudo.map((grupo) => grupo.conteudo_titulo)).toEqual([
      'Atos Administrativos',
      'Direitos Fundamentais'
    ]);
    expect(output.por_assunto.map((grupo) => [grupo.assunto, grupo.total_erros])).toEqual([
      [null, 4],
      ['Anulacao e revogacao', 3],
      ['Motivacao', 1]
    ]);
  });
});
