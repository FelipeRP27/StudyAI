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
