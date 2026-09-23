jest.mock('../repositories/questaoRepository', () => ({
  findParaSessaoPorConteudo: jest.fn(),
  findParaDiagnostico: jest.fn(),
  findAllByConteudoId: jest.fn(),
  findAlternativasByQuestaoIds: jest.fn()
}));

jest.mock('../repositories/materiaRepository', () => ({
  findByIdAndUserId: jest.fn()
}));

jest.mock('../repositories/respostaRepository', () => ({
  getDesempenhoResumo: jest.fn()
}));

jest.mock('../services/conteudoOwnershipService', () => ({
  ensureConteudoOwnership: jest.fn()
}));

const questaoRepository = require('../repositories/questaoRepository');
const materiaRepository = require('../repositories/materiaRepository');
const respostaRepository = require('../repositories/respostaRepository');
const conteudoOwnershipService = require('../services/conteudoOwnershipService');
const sessaoEstudoService = require('../services/sessaoEstudoService');
const AppError = require('../config/appError');

function questao(id, extra = {}) {
  return {
    id,
    conteudo_id: 5,
    enunciado: `Questao ${id}`,
    assunto: 'Licitacoes',
    created_at: '2026-09-01T00:00:00Z',
    total_respostas: 0,
    total_erros: 0,
    ultima_resposta_em: null,
    ultima_resposta_correta: null,
    ...extra
  };
}

describe('sessaoEstudoService.getSessaoPorConteudo', () => {
  beforeEach(() => {
    conteudoOwnershipService.ensureConteudoOwnership.mockResolvedValue({
      id: 5,
      titulo: 'Licitacoes',
      materia_id: 10
    });
    materiaRepository.findByIdAndUserId.mockResolvedValue({ id: 10, nome: 'Direito Administrativo' });
    questaoRepository.findAlternativasByQuestaoIds.mockImplementation((ids) =>
      Promise.resolve(ids.map((id) => ({ id: id * 10, questao_id: id, texto: 'alt', is_correta: true })))
    );
  });

  test('monta a sessao com alternativas e classifica o status de cada questao', async () => {
    questaoRepository.findParaSessaoPorConteudo.mockResolvedValue([
      questao(1),
      questao(2, { total_respostas: 3, total_erros: 2, ultima_resposta_correta: false }),
      questao(3, { total_respostas: 2, total_erros: 1, ultima_resposta_correta: true }),
      questao(4, { total_respostas: 1, total_erros: 0, ultima_resposta_correta: true })
    ]);
    questaoRepository.findAllByConteudoId.mockResolvedValue([1, 2, 3, 4, 5].map((id) => ({ id })));

    const output = await sessaoEstudoService.getSessaoPorConteudo({
      conteudoId: 5,
      usuarioId: 7,
      quantidade: 4
    });

    expect(questaoRepository.findParaSessaoPorConteudo).toHaveBeenCalledWith({
      conteudoId: 5,
      usuarioId: 7,
      limite: 4
    });
    expect(output.conteudo).toEqual({
      id: 5,
      titulo: 'Licitacoes',
      materia_id: 10,
      materia_nome: 'Direito Administrativo'
    });
    expect(output.questoes.map((q) => q.status)).toEqual([
      'nao_respondida',
      'erro_pendente',
      'ja_errada',
      'ja_respondida'
    ]);
    expect(output.questoes[0].alternativas).toHaveLength(1);
    expect(output.total_disponivel).toBe(5);
    expect(output.faltam).toBe(0);
    expect(output.precisa_gerar_questoes).toBe(false);
  });

  test('sinaliza que faltam questoes quando o conteudo nao tem o suficiente', async () => {
    questaoRepository.findParaSessaoPorConteudo.mockResolvedValue([questao(1), questao(2)]);
    questaoRepository.findAllByConteudoId.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const output = await sessaoEstudoService.getSessaoPorConteudo({
      conteudoId: 5,
      usuarioId: 7,
      quantidade: 10
    });

    expect(output.faltam).toBe(8);
    expect(output.precisa_gerar_questoes).toBe(true);
  });

  test('propaga 404 quando o conteudo nao e do usuario', async () => {
    conteudoOwnershipService.ensureConteudoOwnership.mockRejectedValue(
      new AppError('Conteudo not found', 404)
    );

    await expect(
      sessaoEstudoService.getSessaoPorConteudo({ conteudoId: 99, usuarioId: 7 })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(questaoRepository.findParaSessaoPorConteudo).not.toHaveBeenCalled();
  });
});

describe('sessaoEstudoService.getDiagnostico', () => {
  beforeEach(() => {
    questaoRepository.findAlternativasByQuestaoIds.mockResolvedValue([]);
  });

  test('informa quantas respostas faltam para o plano ser gerado', async () => {
    questaoRepository.findParaDiagnostico.mockResolvedValue([
      { ...questao(8), conteudo_titulo: 'Licitacoes', materia_id: 10, materia_nome: 'Direito Administrativo' }
    ]);
    respostaRepository.getDesempenhoResumo.mockResolvedValue({ total_respostas: 4, total_acertos: 2 });

    const output = await sessaoEstudoService.getDiagnostico({ usuarioId: 7, quantidade: 10 });

    expect(output.status).toBe('ok');
    expect(output.mensagem).toContain('Faltam 6 respostas');
    expect(output.minimo_respostas).toBe(10);
    expect(output.questoes[0]).toEqual(
      expect.objectContaining({ id: 8, conteudo_titulo: 'Licitacoes', status: 'nao_respondida' })
    );
  });

  test('avisa quando nao ha questoes novas para o diagnostico', async () => {
    questaoRepository.findParaDiagnostico.mockResolvedValue([]);
    respostaRepository.getDesempenhoResumo.mockResolvedValue({ total_respostas: 0, total_acertos: 0 });

    const output = await sessaoEstudoService.getDiagnostico({ usuarioId: 7 });

    expect(output.status).toBe('sem_questoes');
    expect(output.mensagem).toContain('Gere questões');
    expect(output.questoes).toEqual([]);
  });
});
