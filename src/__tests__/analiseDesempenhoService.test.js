const analiseDesempenhoService = require('../services/analiseDesempenhoService');

describe('analiseDesempenhoService.classificarPrioridade', () => {
  test('classifica como sem_dados quando ha poucas respostas', () => {
    expect(
      analiseDesempenhoService.classificarPrioridade({ totalRespostas: 4, taxaAcerto: 25 })
    ).toBe('sem_dados');
  });

  test('classifica como alta quando a taxa fica abaixo de 60%', () => {
    expect(
      analiseDesempenhoService.classificarPrioridade({ totalRespostas: 25, taxaAcerto: 52 })
    ).toBe('alta');
  });

  test('classifica como media entre 60% e 79%', () => {
    expect(
      analiseDesempenhoService.classificarPrioridade({ totalRespostas: 10, taxaAcerto: 68 })
    ).toBe('media');
  });

  test('classifica como baixa a partir de 80%', () => {
    expect(
      analiseDesempenhoService.classificarPrioridade({ totalRespostas: 10, taxaAcerto: 91 })
    ).toBe('baixa');
  });
});

describe('analiseDesempenhoService.calcularDiasSemResponder', () => {
  test('conta os dias inteiros desde a ultima resposta', () => {
    const agora = new Date('2026-09-01T12:00:00Z');
    const dias = analiseDesempenhoService.calcularDiasSemResponder(
      '2026-08-20T12:00:00Z',
      agora
    );
    expect(dias).toBe(12);
  });

  test('devolve null quando nao ha data', () => {
    expect(analiseDesempenhoService.calcularDiasSemResponder(null)).toBeNull();
  });
});

describe('analiseDesempenhoService.analisarConteudos', () => {
  const agora = new Date('2026-09-01T12:00:00Z');

  const linhas = [
    {
      conteudo_id: 1,
      conteudo_titulo: 'Servicos Publicos',
      materia_id: 10,
      materia_nome: 'Direito Administrativo',
      total_respostas: 11,
      total_acertos: 10,
      ultima_resposta_em: '2026-08-31T12:00:00Z'
    },
    {
      conteudo_id: 2,
      conteudo_titulo: 'Atos Administrativos',
      materia_id: 10,
      materia_nome: 'Direito Administrativo',
      total_respostas: 25,
      total_acertos: 13,
      ultima_resposta_em: '2026-08-20T12:00:00Z'
    },
    {
      conteudo_id: 3,
      conteudo_titulo: 'Licitacoes',
      materia_id: 10,
      materia_nome: 'Direito Administrativo',
      total_respostas: 25,
      total_acertos: 17,
      ultima_resposta_em: '2026-08-29T12:00:00Z'
    }
  ];

  test('ordena por prioridade e calcula taxa, prioridade e recencia', () => {
    const itens = analiseDesempenhoService.analisarConteudos(linhas, { agora });

    expect(itens.map((item) => item.conteudo_titulo)).toEqual([
      'Atos Administrativos',
      'Licitacoes',
      'Servicos Publicos'
    ]);
    expect(itens[0]).toEqual(
      expect.objectContaining({ taxa_acerto: 52, prioridade: 'alta', dias_sem_responder: 12 })
    );
    expect(itens[1].prioridade).toBe('media');
    expect(itens[2].prioridade).toBe('baixa');
  });

  test('empurra conteudos sem dados suficientes para o fim da lista', () => {
    const itens = analiseDesempenhoService.analisarConteudos(
      [
        {
          conteudo_id: 4,
          conteudo_titulo: 'Novo conteudo',
          materia_id: 10,
          materia_nome: 'Direito Administrativo',
          total_respostas: 2,
          total_acertos: 0,
          ultima_resposta_em: '2026-08-31T12:00:00Z'
        },
        ...linhas
      ],
      { agora }
    );

    expect(itens[itens.length - 1].prioridade).toBe('sem_dados');
  });
});

describe('analiseDesempenhoService.temDadosSuficientes', () => {
  test('exige volume minimo de respostas e ao menos um conteudo classificado', () => {
    expect(
      analiseDesempenhoService.temDadosSuficientes([
        { total_respostas: 4, prioridade: 'sem_dados' },
        { total_respostas: 3, prioridade: 'sem_dados' }
      ])
    ).toBe(false);

    expect(
      analiseDesempenhoService.temDadosSuficientes([
        { total_respostas: 25, prioridade: 'alta' }
      ])
    ).toBe(true);
  });
});

describe('analiseDesempenhoService.calcularTendencia', () => {
  test('indica piora quando a taxa recente cai 10 pontos ou mais', () => {
    expect(
      analiseDesempenhoService.calcularTendencia({
        totalRespostas: 30,
        totalAcertos: 18,
        respostasRecentes: 10,
        acertosRecentes: 3
      })
    ).toBe('piora');
  });

  test('indica melhora quando a taxa recente sobe 10 pontos ou mais', () => {
    expect(
      analiseDesempenhoService.calcularTendencia({
        totalRespostas: 25,
        totalAcertos: 17,
        respostasRecentes: 10,
        acertosRecentes: 10
      })
    ).toBe('melhora');
  });

  test('indica estavel quando a variacao e pequena', () => {
    expect(
      analiseDesempenhoService.calcularTendencia({
        totalRespostas: 20,
        totalAcertos: 14,
        respostasRecentes: 10,
        acertosRecentes: 7
      })
    ).toBe('estavel');
  });

  test('fica indefinida sem volume suficiente antes da janela recente', () => {
    expect(
      analiseDesempenhoService.calcularTendencia({
        totalRespostas: 12,
        totalAcertos: 6,
        respostasRecentes: 10,
        acertosRecentes: 5
      })
    ).toBe('indefinida');
  });
});

describe('analiseDesempenhoService.calcularPontuacao', () => {
  test('sem sinais extras a pontuacao e o complemento da taxa de acerto', () => {
    expect(analiseDesempenhoService.calcularPontuacao({ taxaAcerto: 52 })).toBe(48);
  });

  test('soma os ajustes de piora, sessoes com erro, tempo sem pratica e erros recorrentes', () => {
    expect(
      analiseDesempenhoService.calcularPontuacao({
        taxaAcerto: 70,
        tendencia: 'piora',
        sessoesRecentes: 5,
        sessoesComErro: 3,
        diasSemResponder: 15,
        questoesErroRecorrente: 1
      })
    ).toBe(30 + 10 + 10 + 5 + 5);
  });

  test('duas sessoes com erro somam o ajuste menor', () => {
    expect(
      analiseDesempenhoService.calcularPontuacao({
        taxaAcerto: 70,
        sessoesRecentes: 3,
        sessoesComErro: 2
      })
    ).toBe(35);
  });

  test('melhora recente reduz a pontuacao sem ficar negativa', () => {
    expect(
      analiseDesempenhoService.calcularPontuacao({ taxaAcerto: 55, tendencia: 'melhora' })
    ).toBe(35);
    expect(
      analiseDesempenhoService.calcularPontuacao({ taxaAcerto: 98, tendencia: 'melhora' })
    ).toBe(0);
  });
});

describe('analiseDesempenhoService.classificarPrioridade com pontuacao', () => {
  test('usa os limiares equivalentes a 60% e 80% de acerto', () => {
    const classificar = (pontuacao) =>
      analiseDesempenhoService.classificarPrioridade({ totalRespostas: 10, taxaAcerto: 0, pontuacao });

    expect(classificar(40.01)).toBe('alta');
    expect(classificar(40)).toBe('media');
    expect(classificar(20.01)).toBe('media');
    expect(classificar(20)).toBe('baixa');
  });

  test('bom desempenho parado ha 30 dias sobe para prioridade media', () => {
    const pontuacao = analiseDesempenhoService.calcularPontuacao({
      taxaAcerto: 85,
      diasSemResponder: 30
    });

    expect(
      analiseDesempenhoService.classificarPrioridade({ totalRespostas: 20, taxaAcerto: 85, pontuacao })
    ).toBe('media');
  });
});

describe('analiseDesempenhoService.identificarAssuntosDificeis', () => {
  test('mantem no maximo dois assuntos com pelo menos dois erros, do mais errado ao menos', () => {
    expect(
      analiseDesempenhoService.identificarAssuntosDificeis([
        { assunto: 'Atributos do ato', respostas: 5, erros: 1 },
        { assunto: 'Motivacao', respostas: 4, erros: 2 },
        { assunto: 'Anulacao e revogacao', respostas: 8, erros: 5 },
        { assunto: 'Convalidacao', respostas: 6, erros: 3 }
      ])
    ).toEqual([
      { assunto: 'Anulacao e revogacao', erros: 5, respostas: 8 },
      { assunto: 'Convalidacao', erros: 3, respostas: 6 }
    ]);
  });
});

describe('analiseDesempenhoService cenario da persona Mariana', () => {
  test('conteudo com 51% de acerto, piora e erros em tres sessoes fica no topo como prioridade alta', () => {
    const agora = new Date('2026-09-16T12:00:00Z');
    const linhas = analiseDesempenhoService.combinarDadosPorConteudo({
      porConteudo: [
        {
          conteudo_id: 1,
          conteudo_titulo: 'Licitacoes',
          materia_id: 10,
          materia_nome: 'Direito Administrativo',
          total_respostas: 20,
          total_acertos: 14,
          ultima_resposta_em: '2026-09-15T12:00:00Z'
        },
        {
          conteudo_id: 2,
          conteudo_titulo: 'Atos Administrativos',
          materia_id: 10,
          materia_nome: 'Direito Administrativo',
          total_respostas: 35,
          total_acertos: 18,
          ultima_resposta_em: '2026-09-10T12:00:00Z'
        }
      ],
      recentes: [
        { conteudo_id: 1, respostas_recentes: 10, acertos_recentes: 7 },
        { conteudo_id: 2, respostas_recentes: 10, acertos_recentes: 3 }
      ],
      sessoes: [{ conteudo_id: 2, sessoes_recentes: 3, sessoes_com_erro: 3 }],
      assuntos: [{ conteudo_id: 2, assunto: 'Anulacao e revogacao', respostas: 7, erros: 5 }],
      erros: [{ conteudo_id: 2, questoes_erro_recorrente: 2, questoes_pendentes: 3 }]
    });

    const [primeiro, segundo] = analiseDesempenhoService.analisarConteudos(linhas, { agora });

    expect(primeiro).toEqual(
      expect.objectContaining({
        conteudo_titulo: 'Atos Administrativos',
        prioridade: 'alta',
        tendencia: 'piora',
        sessoes_com_erro: 3,
        questoes_pendentes: 3,
        dias_sem_responder: 6
      })
    );
    expect(primeiro.pontuacao).toBeCloseTo(48.57 + 10 + 10 + 5, 2);
    expect(primeiro.assuntos_dificeis[0].assunto).toBe('Anulacao e revogacao');
    expect(segundo).toEqual(
      expect.objectContaining({ conteudo_titulo: 'Licitacoes', prioridade: 'media', tendencia: 'estavel' })
    );
  });
});

describe('analiseDesempenhoService.analisarMaterias', () => {
  const linhas = [
    { materia_id: 1, materia_nome: 'Constitucional', total_respostas: 40, total_acertos: 36 },
    { materia_id: 2, materia_nome: 'Administrativo', total_respostas: 50, total_acertos: 29 },
    { materia_id: 3, materia_nome: 'Tributario', total_respostas: 20, total_acertos: 15 },
    { materia_id: 4, materia_nome: 'Penal', total_respostas: 3, total_acertos: 0 }
  ];

  test('separa materias abaixo da media e as mais fortes, ignorando as com poucas respostas', () => {
    const diagnostico = analiseDesempenhoService.analisarMaterias(linhas, 72);

    expect(diagnostico.materias_atencao.map((m) => m.materia_nome)).toEqual(['Administrativo']);
    expect(diagnostico.materias_atencao[0]).toEqual(
      expect.objectContaining({ taxa_acerto: 58, diferenca_media: -14 })
    );
    expect(diagnostico.materias_fortes.map((m) => m.materia_nome)).toEqual([
      'Constitucional',
      'Tributario'
    ]);
  });

  test('nao compara quando ha menos de duas materias com dados', () => {
    expect(analiseDesempenhoService.analisarMaterias([linhas[0], linhas[3]], 80)).toEqual({
      materias_atencao: [],
      materias_fortes: []
    });
  });
});
