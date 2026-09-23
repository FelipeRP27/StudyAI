jest.mock('../repositories/respostaRepository', () => ({
  getDesempenhoResumo: jest.fn(),
  getDesempenhoPorConteudo: jest.fn(),
  getDesempenhoPorMateria: jest.fn(),
  getDesempenhoRecentePorConteudo: jest.fn(),
  getSessoesRecentesPorConteudo: jest.fn(),
  getErrosRecentesPorAssunto: jest.fn()
}));

jest.mock('../repositories/cadernoErrosRepository', () => ({
  getResumoErrosPorConteudo: jest.fn()
}));

jest.mock('../repositories/atividadeEstudoRepository', () => ({
  findUltimaPorConteudo: jest.fn()
}));

const respostaRepository = require('../repositories/respostaRepository');
const cadernoErrosRepository = require('../repositories/cadernoErrosRepository');
const atividadeEstudoRepository = require('../repositories/atividadeEstudoRepository');
const planoEstudoService = require('../services/planoEstudoService');

describe('planoEstudoService.getPlanoEstudo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    respostaRepository.getDesempenhoPorMateria.mockResolvedValue([]);
    respostaRepository.getDesempenhoRecentePorConteudo.mockResolvedValue([]);
    respostaRepository.getSessoesRecentesPorConteudo.mockResolvedValue([]);
    respostaRepository.getErrosRecentesPorAssunto.mockResolvedValue([]);
    cadernoErrosRepository.getResumoErrosPorConteudo.mockResolvedValue([]);
    atividadeEstudoRepository.findUltimaPorConteudo.mockResolvedValue([]);
  });

  test('monta o plano priorizado com justificativa e recomendacao por conteudo', async () => {
    respostaRepository.getDesempenhoResumo.mockResolvedValue({
      total_respostas: 50,
      total_acertos: 37,
      total_erros: 13
    });
    respostaRepository.getDesempenhoPorConteudo.mockResolvedValue([
      {
        conteudo_id: 1,
        conteudo_titulo: 'Servicos Publicos',
        materia_id: 10,
        materia_nome: 'Direito Administrativo',
        total_respostas: 25,
        total_acertos: 23,
        ultima_resposta_em: new Date().toISOString()
      },
      {
        conteudo_id: 2,
        conteudo_titulo: 'Atos Administrativos',
        materia_id: 10,
        materia_nome: 'Direito Administrativo',
        total_respostas: 25,
        total_acertos: 13,
        ultima_resposta_em: new Date().toISOString()
      }
    ]);

    const output = await planoEstudoService.getPlanoEstudo({ usuarioId: 1 });

    expect(respostaRepository.getDesempenhoPorConteudo).toHaveBeenCalledWith(1);
    expect(output.status).toBe('ok');
    expect(output.acao_inicial).toBeNull();
    expect(output.resumo).toEqual(
      expect.objectContaining({ taxa_acerto: 74, conteudos_analisados: 2 })
    );

    const prioritario = output.itens[0];
    expect(prioritario.conteudo_titulo).toBe('Atos Administrativos');
    expect(prioritario.prioridade).toBe('alta');
    expect(prioritario.justificativa).toContain('acertou 52%');
    expect(prioritario.justificativa).toContain('abaixo da sua média geral de 74%');
    expect(prioritario.recomendacao).toContain('10 questões');
    expect(output.itens[1].prioridade).toBe('baixa');
    expect(output.itens[1].justificativa).toContain('acima da sua média geral de 74%');
  });

  test('devolve dados_insuficientes com acao inicial quando ha poucas respostas', async () => {
    respostaRepository.getDesempenhoResumo.mockResolvedValue({
      total_respostas: 3,
      total_acertos: 2,
      total_erros: 1
    });
    respostaRepository.getDesempenhoPorConteudo.mockResolvedValue([
      {
        conteudo_id: 1,
        conteudo_titulo: 'Atos Administrativos',
        materia_id: 10,
        materia_nome: 'Direito Administrativo',
        total_respostas: 3,
        total_acertos: 2,
        ultima_resposta_em: new Date().toISOString()
      }
    ]);

    const output = await planoEstudoService.getPlanoEstudo({ usuarioId: 1 });

    expect(output.status).toBe('dados_insuficientes');
    expect(output.acao_inicial).toBe('Responder questões de diagnóstico');
    expect(output.mensagem).toContain('Ainda precisamos conhecer melhor seu desempenho');
    expect(output.itens[0].prioridade).toBe('sem_dados');
  });

  test('nao quebra quando o usuario ainda nao respondeu nada', async () => {
    respostaRepository.getDesempenhoResumo.mockResolvedValue({
      total_respostas: 0,
      total_acertos: 0,
      total_erros: 0
    });
    respostaRepository.getDesempenhoPorConteudo.mockResolvedValue([]);

    const output = await planoEstudoService.getPlanoEstudo({ usuarioId: 1 });

    expect(output.status).toBe('dados_insuficientes');
    expect(output.resumo.taxa_acerto).toBe(0);
    expect(output.itens).toEqual([]);
    expect(output.diagnostico_materias).toEqual({ materias_atencao: [], materias_fortes: [] });
  });

  test('diagnostica piora recente, sessoes com erro, assuntos dificeis e erros pendentes', async () => {
    const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    respostaRepository.getDesempenhoResumo.mockResolvedValue({
      total_respostas: 100,
      total_acertos: 72,
      total_erros: 28
    });
    respostaRepository.getDesempenhoPorConteudo.mockResolvedValue([
      {
        conteudo_id: 2,
        conteudo_titulo: 'Atos Administrativos',
        materia_id: 10,
        materia_nome: 'Direito Administrativo',
        total_respostas: 35,
        total_acertos: 18,
        ultima_resposta_em: tresDiasAtras
      }
    ]);
    respostaRepository.getDesempenhoPorMateria.mockResolvedValue([
      { materia_id: 10, materia_nome: 'Direito Administrativo', total_respostas: 60, total_acertos: 35 },
      { materia_id: 20, materia_nome: 'Direito Constitucional', total_respostas: 40, total_acertos: 37 }
    ]);
    respostaRepository.getDesempenhoRecentePorConteudo.mockResolvedValue([
      { conteudo_id: 2, respostas_recentes: 10, acertos_recentes: 3 }
    ]);
    respostaRepository.getSessoesRecentesPorConteudo.mockResolvedValue([
      { conteudo_id: 2, sessoes_recentes: 4, sessoes_com_erro: 3 }
    ]);
    respostaRepository.getErrosRecentesPorAssunto.mockResolvedValue([
      { conteudo_id: 2, assunto: 'Anulação e revogação', respostas: 8, erros: 5 },
      { conteudo_id: 2, assunto: 'Atributos do ato', respostas: 6, erros: 1 }
    ]);
    cadernoErrosRepository.getResumoErrosPorConteudo.mockResolvedValue([
      { conteudo_id: 2, questoes_com_erro: 4, questoes_erro_recorrente: 2, questoes_pendentes: 3 }
    ]);

    const output = await planoEstudoService.getPlanoEstudo({ usuarioId: 1 });
    const [item] = output.itens;

    expect(respostaRepository.getDesempenhoRecentePorConteudo).toHaveBeenCalledWith(1, 10);
    expect(respostaRepository.getSessoesRecentesPorConteudo).toHaveBeenCalledWith(1, 5);
    expect(respostaRepository.getErrosRecentesPorAssunto).toHaveBeenCalledWith(1, 20);
    expect(cadernoErrosRepository.getResumoErrosPorConteudo).toHaveBeenCalledWith(1, 2);

    expect(item).toEqual(
      expect.objectContaining({
        prioridade: 'alta',
        tendencia: 'piora',
        taxa_recente: 30,
        sessoes_com_erro: 3,
        questoes_erro_recorrente: 2,
        questoes_pendentes: 3,
        assuntos_dificeis: [{ assunto: 'Anulação e revogação', erros: 5, respostas: 8 }]
      })
    );
    expect(item.justificativa).toContain('Nas últimas 10 questões, sua taxa caiu para 30%.');
    expect(item.justificativa).toContain('em 3 das últimas 4 sessões de estudo');
    expect(item.justificativa).toContain('maior dificuldade em anulação e revogação.');
    expect(item.justificativa).toContain('2 questões foram erradas mais de uma vez.');
    expect(item.recomendacao).toContain('10 questões');
    expect(item.recomendacao).toContain('Comece refazendo os 3 erros pendentes no caderno de erros.');

    expect(output.resumo.questoes_pendentes).toBe(3);
    expect(output.diagnostico_materias.materias_atencao).toEqual([
      expect.objectContaining({ materia_nome: 'Direito Administrativo', taxa_acerto: 58.33, diferenca_media: -13.67 })
    ]);
    expect(output.diagnostico_materias.materias_fortes).toEqual([
      expect.objectContaining({ materia_nome: 'Direito Constitucional', taxa_acerto: 92.5 })
    ]);
  });

  test('usa a atividade de estudo como recencia quando ela e mais recente que a resposta', async () => {
    const vinteDiasAtras = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const doisDiasAtras = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    respostaRepository.getDesempenhoResumo.mockResolvedValue({
      total_respostas: 20,
      total_acertos: 13,
      total_erros: 7
    });
    respostaRepository.getDesempenhoPorConteudo.mockResolvedValue([
      {
        conteudo_id: 3,
        conteudo_titulo: 'Licitacoes',
        materia_id: 10,
        materia_nome: 'Direito Administrativo',
        total_respostas: 20,
        total_acertos: 13,
        ultima_resposta_em: vinteDiasAtras
      }
    ]);
    atividadeEstudoRepository.findUltimaPorConteudo.mockResolvedValue([
      { conteudo_id: 3, ultima_atividade_em: doisDiasAtras, total_atividades: 4 }
    ]);

    const output = await planoEstudoService.getPlanoEstudo({ usuarioId: 1 });
    const [item] = output.itens;

    expect(item.dias_sem_responder).toBe(20);
    expect(item.dias_sem_estudar).toBe(2);
    expect(item.justificativa).toContain('Você estudou este conteúdo pela última vez há 2 dias.');
    expect(item.justificativa).not.toContain('A última resposta foi há 20 dias.');
  });

  test('recomenda revisao por tempo quando bom desempenho fica muito tempo sem pratica', async () => {
    const quarentaDiasAtras = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

    respostaRepository.getDesempenhoResumo.mockResolvedValue({
      total_respostas: 20,
      total_acertos: 17,
      total_erros: 3
    });
    respostaRepository.getDesempenhoPorConteudo.mockResolvedValue([
      {
        conteudo_id: 5,
        conteudo_titulo: 'Imunidades Tributarias',
        materia_id: 30,
        materia_nome: 'Direito Tributario',
        total_respostas: 20,
        total_acertos: 17,
        ultima_resposta_em: quarentaDiasAtras
      }
    ]);

    const output = await planoEstudoService.getPlanoEstudo({ usuarioId: 1 });

    expect(output.itens[0].prioridade).toBe('media');
    expect(output.itens[0].recomendacao).toContain('revisão rápida do resumo');
    expect(output.itens[0].recomendacao).not.toContain('caderno de erros');
  });
});
