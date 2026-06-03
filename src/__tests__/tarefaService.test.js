jest.mock('../repositories/tarefaRepository', () => ({
  create: jest.fn(),
  findAllByUserId: jest.fn(),
  findByIdAndUserId: jest.fn(),
  update: jest.fn(),
  setStatus: jest.fn(),
  remove: jest.fn()
}));

jest.mock('../repositories/materiaRepository', () => ({
  findByIdAndUserId: jest.fn()
}));

jest.mock('../services/tarefaOwnershipService', () => ({
  ensureTarefaOwnership: jest.fn()
}));

const tarefaRepository = require('../repositories/tarefaRepository');
const materiaRepository = require('../repositories/materiaRepository');
const tarefaOwnershipService = require('../services/tarefaOwnershipService');
const tarefaService = require('../services/tarefaService');
const AppError = require('../config/appError');

function isoDateOffset(dias) {
  const agora = new Date();
  const dataUtc = new Date(
    Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate() + dias)
  );
  return dataUtc.toISOString().slice(0, 10);
}

describe('tarefaService.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tarefaRepository.create.mockImplementation((input) =>
      Promise.resolve({
        id: 1,
        usuario_id: input.usuarioId,
        materia_id: input.materiaId,
        titulo: input.titulo,
        descricao: input.descricao,
        data_limite: input.dataLimite,
        status: 'pendente',
        created_at: '2026-05-04T00:00:00Z',
        concluida_em: null
      })
    );
  });

  test('cria tarefa sem materia e classifica urgencia conforme data', async () => {
    const output = await tarefaService.create({
      usuarioId: 1,
      materiaId: null,
      titulo: 'Estudar',
      descricao: null,
      dataLimite: isoDateOffset(2)
    });

    expect(output.urgencia).toBe('urgente');
    expect(output.dias_restantes).toBe(2);
    expect(materiaRepository.findByIdAndUserId).not.toHaveBeenCalled();
  });

  test('valida ownership da materia quando informada', async () => {
    materiaRepository.findByIdAndUserId.mockResolvedValue({ id: 5 });

    await tarefaService.create({
      usuarioId: 1,
      materiaId: 5,
      titulo: 'X',
      descricao: null,
      dataLimite: isoDateOffset(10)
    });

    expect(materiaRepository.findByIdAndUserId).toHaveBeenCalledWith(5, 1);
  });

  test('rejeita criacao quando materia nao pertence ao usuario', async () => {
    materiaRepository.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      tarefaService.create({
        usuarioId: 1,
        materiaId: 5,
        titulo: 'X',
        descricao: null,
        dataLimite: isoDateOffset(5)
      })
    ).rejects.toThrow(AppError);
    expect(tarefaRepository.create).not.toHaveBeenCalled();
  });
});

describe('tarefaService.setStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tarefaOwnershipService.ensureTarefaOwnership.mockResolvedValue({ id: 1 });
    tarefaRepository.setStatus.mockResolvedValue({});
    tarefaRepository.findByIdAndUserId.mockResolvedValue({
      id: 1,
      usuario_id: 1,
      materia_id: null,
      titulo: 'X',
      descricao: null,
      data_limite: isoDateOffset(3),
      status: 'concluida',
      created_at: '2026-05-04',
      concluida_em: '2026-05-04T12:00:00Z',
      materia_nome: null
    });
  });

  test('marca como concluida e devolve DTO com urgencia=concluida', async () => {
    const output = await tarefaService.setStatus({ id: 1, usuarioId: 1, status: 'concluida' });

    expect(tarefaRepository.setStatus).toHaveBeenCalledWith({
      id: 1,
      usuarioId: 1,
      status: 'concluida'
    });
    expect(output.urgencia).toBe('concluida');
    expect(output.status).toBe('concluida');
  });

  test('propaga erro quando tarefa nao pertence ao usuario', async () => {
    tarefaOwnershipService.ensureTarefaOwnership.mockRejectedValue(
      new AppError('Tarefa not found', 404)
    );

    await expect(
      tarefaService.setStatus({ id: 1, usuarioId: 1, status: 'concluida' })
    ).rejects.toThrow('Tarefa not found');
    expect(tarefaRepository.setStatus).not.toHaveBeenCalled();
  });
});
