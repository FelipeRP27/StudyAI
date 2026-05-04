jest.mock('../repositories/respostaRepository', () => ({
  getDesempenhoResumo: jest.fn(),
  getDesempenhoPorMateria: jest.fn(),
  getEvolucaoDiaria: jest.fn()
}));

const respostaRepository = require('../repositories/respostaRepository');
const desempenhoService = require('../services/desempenhoService');

describe('desempenhoService.getDesempenho', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('agrega resumo, por materia e evolucao com taxa_acerto calculada', async () => {
    respostaRepository.getDesempenhoResumo.mockResolvedValue({
      total_respostas: 10,
      total_acertos: 7,
      total_erros: 3
    });
    respostaRepository.getDesempenhoPorMateria.mockResolvedValue([
      { materia_id: 1, materia_nome: 'Constitucional', total_respostas: 4, total_acertos: 3 },
      { materia_id: 2, materia_nome: 'Administrativo', total_respostas: 6, total_acertos: 4 }
    ]);
    respostaRepository.getEvolucaoDiaria.mockResolvedValue([
      { dia: '2026-05-03', total_respostas: 5, total_acertos: 4 }
    ]);

    const output = await desempenhoService.getDesempenho({ usuarioId: 1, dias: 30 });

    expect(output.resumo.taxa_acerto).toBe(70);
    expect(output.por_materia).toHaveLength(2);
    expect(output.por_materia[0]).toEqual(
      expect.objectContaining({ materia_nome: 'Constitucional', taxa_acerto: 75 })
    );
    expect(output.evolucao[0].taxa_acerto).toBe(80);
    expect(respostaRepository.getEvolucaoDiaria).toHaveBeenCalledWith(1, 30);
  });

  test('taxa_acerto vira 0 quando nao ha respostas', async () => {
    respostaRepository.getDesempenhoResumo.mockResolvedValue({
      total_respostas: 0,
      total_acertos: 0,
      total_erros: 0
    });
    respostaRepository.getDesempenhoPorMateria.mockResolvedValue([]);
    respostaRepository.getEvolucaoDiaria.mockResolvedValue([]);

    const output = await desempenhoService.getDesempenho({ usuarioId: 1 });

    expect(output.resumo.taxa_acerto).toBe(0);
    expect(output.por_materia).toEqual([]);
    expect(output.evolucao).toEqual([]);
  });
});
