jest.mock('../services/planoEstudoService', () => ({
  getPlanoEstudo: jest.fn()
}));

jest.mock('../services/cadernoErrosService', () => ({
  resumir: jest.fn()
}));

jest.mock('../repositories/respostaRepository', () => ({
  getEvolucaoDiaria: jest.fn()
}));

const planoEstudoService = require('../services/planoEstudoService');
const cadernoErrosService = require('../services/cadernoErrosService');
const respostaRepository = require('../repositories/respostaRepository');
const painelService = require('../services/painelService');

function diasAtras(dias) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

function itemPlano(sobrescrever) {
  return {
    conteudo_id: 1,
    conteudo_titulo: 'Atos Administrativos',
    materia_id: 10,
    materia_nome: 'Direito Administrativo',
    prioridade: 'alta',
    taxa_acerto: 52,
    tendencia: 'piora',
    dias_sem_estudar: 3,
    questoes_pendentes: 2,
    assuntos_dificeis: [],
    justificativa: 'Justificativa',
    acoes: [{ tipo: 'erros', rotulo: 'Refazer 2 erros', rota: '/erros?conteudo_id=1', quantidade: 2 }],
    ...sobrescrever
  };
}

const planoOk = {
  status: 'ok',
  mensagem: 'Plano gerado',
  resumo: { total_respostas: 40, total_acertos: 26, taxa_acerto: 65 },
  diagnostico_materias: { materias_fortes: [{ materia_id: 20 }], materias_atencao: [{ materia_id: 10 }] },
  itens: [
    itemPlano(),
    itemPlano({ conteudo_id: 2, conteudo_titulo: 'Licitacoes', prioridade: 'media', dias_sem_estudar: 20 }),
    itemPlano({ conteudo_id: 3, conteudo_titulo: 'Servicos', prioridade: 'baixa', dias_sem_estudar: 40 }),
    itemPlano({ conteudo_id: 4, conteudo_titulo: 'Novo', prioridade: 'sem_dados', dias_sem_estudar: 0 })
  ]
};

describe('painelService.calcularEvolucao', () => {
  test('compara a taxa dos ultimos 7 dias com a do periodo', () => {
    const evolucao = painelService.calcularEvolucao([
      { dia: diasAtras(25), total_respostas: 10, total_acertos: 5 },
      { dia: diasAtras(2), total_respostas: 10, total_acertos: 9 }
    ]);

    expect(evolucao).toEqual(
      expect.objectContaining({
        respostas_no_periodo: 20,
        respostas_recentes: 10,
        taxa_periodo: 70,
        taxa_recente: 90,
        variacao: 20
      })
    );
  });

  test('nao calcula variacao sem respostas recentes', () => {
    const evolucao = painelService.calcularEvolucao([
      { dia: diasAtras(20), total_respostas: 5, total_acertos: 3 }
    ]);

    expect(evolucao.taxa_recente).toBeNull();
    expect(evolucao.variacao).toBeNull();
  });
});

describe('painelService.getPainel', () => {
  beforeEach(() => {
    cadernoErrosService.resumir.mockResolvedValue({
      questoes: 6,
      pendentes: 2,
      revisadas: 4,
      total_erros: 18,
      por_assunto: [{ assunto: 'Anulacao', total_erros: 5 }, { assunto: 'Licitacao', total_erros: 3 }],
      por_materia: [],
      por_conteudo: []
    });
    respostaRepository.getEvolucaoDiaria.mockResolvedValue([
      { dia: diasAtras(1), total_respostas: 10, total_acertos: 7 }
    ]);
  });

  test('monta as tres secoes do painel a partir do plano e do caderno', async () => {
    planoEstudoService.getPlanoEstudo.mockResolvedValue(planoOk);

    const painel = await painelService.getPainel({ usuarioId: 1 });

    expect(painel.status).toBe('ok');
    expect(painel.como_voce_esta.taxa_acerto).toBe(65);
    expect(painel.como_voce_esta.materias_atencao).toEqual([{ materia_id: 10 }]);
    expect(painel.onde_focar.conteudos_prioritarios.map((c) => c.conteudo_titulo)).toEqual([
      'Atos Administrativos',
      'Licitacoes'
    ]);
    expect(painel.onde_focar.erros).toEqual(
      expect.objectContaining({ questoes: 6, pendentes: 2, total_erros: 18 })
    );
    expect(painel.onde_focar.revisoes_recomendadas.map((c) => c.conteudo_titulo)).toEqual([
      'Licitacoes',
      'Servicos'
    ]);
    expect(painel.o_que_fazer_agora).toHaveLength(3);
    expect(painel.o_que_fazer_agora[0]).toEqual(
      expect.objectContaining({ rota: '/erros?conteudo_id=1', conteudo_titulo: 'Atos Administrativos' })
    );
  });

  test('sem dados suficientes, a unica acao e o diagnostico', async () => {
    planoEstudoService.getPlanoEstudo.mockResolvedValue({
      status: 'dados_insuficientes',
      mensagem: 'Ainda precisamos conhecer melhor seu desempenho.',
      acao_inicial: 'Responder questões de diagnóstico',
      acao_inicial_rota: '/plano/diagnostico',
      resumo: { total_respostas: 3, total_acertos: 2, taxa_acerto: 66.67 },
      diagnostico_materias: { materias_fortes: [], materias_atencao: [] },
      itens: []
    });

    const painel = await painelService.getPainel({ usuarioId: 1 });

    expect(painel.status).toBe('dados_insuficientes');
    expect(painel.o_que_fazer_agora).toEqual([
      expect.objectContaining({ tipo: 'diagnostico', rota: '/plano/diagnostico' })
    ]);
    expect(painel.onde_focar.conteudos_prioritarios).toEqual([]);
  });
});
