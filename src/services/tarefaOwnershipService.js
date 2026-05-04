const tarefaRepository = require('../repositories/tarefaRepository');
const AppError = require('../config/appError');

async function ensureTarefaOwnership(tarefaId, usuarioId) {
  const tarefa = await tarefaRepository.findByIdAndUserId(tarefaId, usuarioId);

  if (!tarefa) {
    throw new AppError('Tarefa not found', 404);
  }

  return tarefa;
}

module.exports = {
  ensureTarefaOwnership
};
