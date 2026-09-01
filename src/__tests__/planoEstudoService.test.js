jest.mock('../repositories/respostaRepository', () => ({
  getDesempenhoResumo: jest.fn(),
  getDesempenhoPorConteudo: jest.fn()
}));

const respostaRepository = require('../repositories/respostaRepository');
const planoEstudoService = require('../services/planoEstudoService');

describe('planoEstudoService.getPlanoEstudo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });
});
