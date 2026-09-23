jest.mock('../repositories/atividadeEstudoRepository', () => ({
  registrar: jest.fn(),
  findUltimaDoConteudo: jest.fn()
}));

jest.mock('../services/conteudoOwnershipService', () => ({
  ensureConteudoOwnership: jest.fn()
}));

const atividadeEstudoRepository = require('../repositories/atividadeEstudoRepository');
const conteudoOwnershipService = require('../services/conteudoOwnershipService');
const atividadeEstudoService = require('../services/atividadeEstudoService');
const { buildRegistrarAtividadeInputDto } = require('../dtos/atividadeEstudoInputDto');
const AppError = require('../config/appError');

describe('atividadeEstudoService.registrar', () => {
  test('registra a atividade validando o dono do conteudo', async () => {
    atividadeEstudoRepository.registrar.mockResolvedValue({
      id: 7,
      usuario_id: 2,
      conteudo_id: 5,
      tipo: 'resumo',
      created_at: '2026-09-23T10:00:00Z'
    });

    const output = await atividadeEstudoService.registrar({
      usuarioId: 2,
      conteudoId: 5,
      tipo: 'resumo'
    });

    expect(conteudoOwnershipService.ensureConteudoOwnership).toHaveBeenCalledWith(5, 2);
    expect(atividadeEstudoRepository.registrar).toHaveBeenCalledWith({
      usuarioId: 2,
      conteudoId: 5,
      tipo: 'resumo',
      minutosEntreRegistros: atividadeEstudoService.MINUTOS_ENTRE_REGISTROS
    });
    expect(output).toEqual({
      registrada: true,
      atividade: { id: 7, conteudo_id: 5, tipo: 'resumo', created_at: '2026-09-23T10:00:00Z' }
    });
  });

  test('nao duplica registro dentro da janela e devolve a atividade anterior', async () => {
    atividadeEstudoRepository.registrar.mockResolvedValue(null);
    atividadeEstudoRepository.findUltimaDoConteudo.mockResolvedValue({
      id: 3,
      conteudo_id: 5,
      tipo: 'conteudo',
      created_at: '2026-09-23T09:50:00Z'
    });

    const output = await atividadeEstudoService.registrar({
      usuarioId: 2,
      conteudoId: 5,
      tipo: 'conteudo'
    });

    expect(output.registrada).toBe(false);
    expect(output.atividade.id).toBe(3);
  });

  test('propaga 404 quando o conteudo nao e do usuario', async () => {
    conteudoOwnershipService.ensureConteudoOwnership.mockRejectedValue(
      new AppError('Conteudo not found', 404)
    );

    await expect(
      atividadeEstudoService.registrar({ usuarioId: 2, conteudoId: 99, tipo: 'questoes' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(atividadeEstudoRepository.registrar).not.toHaveBeenCalled();
  });
});

describe('atividadeEstudoInputDto.buildRegistrarAtividadeInputDto', () => {
  test('aceita os tipos previstos', () => {
    expect(buildRegistrarAtividadeInputDto({ conteudo_id: '4', tipo: 'flashcards' }, 8)).toEqual({
      usuarioId: 8,
      conteudoId: 4,
      tipo: 'flashcards'
    });
  });

  test('rejeita tipo desconhecido e conteudo invalido com 400', () => {
    expect(() => buildRegistrarAtividadeInputDto({ conteudo_id: 4, tipo: 'simulado' }, 8)).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
    expect(() => buildRegistrarAtividadeInputDto({ tipo: 'resumo' }, 8)).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });
});
