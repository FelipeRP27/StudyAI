jest.mock('../repositories/respostaRepository', () => ({
  getDesempenhoResumo: jest.fn(),
  getDesempenhoPorMateria: jest.fn(),
  getEvolucaoDiaria: jest.fn(),
  getResumoPorMateria: jest.fn(),
  getDesempenhoPorConteudoEmMateria: jest.fn(),
  getEvolucaoDiariaPorMateria: jest.fn()
}));

jest.mock('../repositories/materiaRepository', () => ({
  findByIdAndUserId: jest.fn()
}));

const respostaRepository = require('../repositories/respostaRepository');
const materiaRepository = require('../repositories/materiaRepository');
const desempenhoService = require('../services/desempenhoService');
const AppError = require('../config/appError');

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

describe('desempenhoService.getDesempenhoPorMateria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('valida ownership, agrega resumo, por_conteudo e evolucao com taxa', async () => {
    materiaRepository.findByIdAndUserId.mockResolvedValue({
      id: 7,
      nome: 'Direito Constitucional',
      descricao: 'Princípios e direitos fundamentais'
    });
    respostaRepository.getResumoPorMateria.mockResolvedValue({
      total_respostas: 8,
      total_acertos: 6,
      total_erros: 2
    });
    respostaRepository.getDesempenhoPorConteudoEmMateria.mockResolvedValue([
      { conteudo_id: 10, conteudo_titulo: 'Princípios', total_respostas: 4, total_acertos: 4 },
      { conteudo_id: 11, conteudo_titulo: 'Direitos sociais', total_respostas: 4, total_acertos: 2 }
    ]);
    respostaRepository.getEvolucaoDiariaPorMateria.mockResolvedValue([
      { dia: '2026-05-10', total_respostas: 5, total_acertos: 4 }
    ]);

    const output = await desempenhoService.getDesempenhoPorMateria({
      materiaId: 7,
      usuarioId: 1,
      dias: 30
    });

    expect(materiaRepository.findByIdAndUserId).toHaveBeenCalledWith(7, 1);
    expect(output.materia).toEqual({
      id: 7,
      nome: 'Direito Constitucional',
      descricao: 'Princípios e direitos fundamentais'
    });
    expect(output.resumo.taxa_acerto).toBe(75);
    expect(output.por_conteudo).toHaveLength(2);
    expect(output.por_conteudo[0]).toEqual(
      expect.objectContaining({ conteudo_titulo: 'Princípios', taxa_acerto: 100 })
    );
    expect(output.por_conteudo[1].taxa_acerto).toBe(50);
    expect(output.evolucao[0].taxa_acerto).toBe(80);
    expect(respostaRepository.getEvolucaoDiariaPorMateria).toHaveBeenCalledWith(7, 1, 30);
  });

  test('lanca AppError 404 quando materia nao pertence ao usuario', async () => {
    materiaRepository.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      desempenhoService.getDesempenhoPorMateria({ materiaId: 99, usuarioId: 1 })
    ).rejects.toThrow(AppError);
    expect(respostaRepository.getResumoPorMateria).not.toHaveBeenCalled();
  });
});
