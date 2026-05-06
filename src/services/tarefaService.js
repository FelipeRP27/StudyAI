const tarefaRepository = require('../repositories/tarefaRepository');
const materiaRepository = require('../repositories/materiaRepository');
const tarefaOwnershipService = require('./tarefaOwnershipService');
const AppError = require('../config/appError');
const {
  toTarefaResponseDto,
  toTarefaListResponseDto
} = require('../dtos/tarefaOutputDto');

async function ensureMateriaOwnership(materiaId, usuarioId) {
  if (!materiaId) return;
  const materia = await materiaRepository.findByIdAndUserId(materiaId, usuarioId);
  if (!materia) {
    throw new AppError('Materia not found', 404);
  }
}

async function create(input) {
  await ensureMateriaOwnership(input.materiaId, input.usuarioId);
  const tarefa = await tarefaRepository.create(input);
  return toTarefaResponseDto({ ...tarefa, materia_nome: null });
}

async function listByUser(usuarioId) {
  const tarefas = await tarefaRepository.findAllByUserId(usuarioId);
  return toTarefaListResponseDto(tarefas);
}

async function update(input) {
  await tarefaOwnershipService.ensureTarefaOwnership(input.id, input.usuarioId);
  await ensureMateriaOwnership(input.materiaId, input.usuarioId);
  const tarefa = await tarefaRepository.update(input);
  const enriched = await tarefaRepository.findByIdAndUserId(tarefa.id, input.usuarioId);
  return toTarefaResponseDto(enriched);
}

async function setStatus({ id, usuarioId, status }) {
  await tarefaOwnershipService.ensureTarefaOwnership(id, usuarioId);
  await tarefaRepository.setStatus({ id, usuarioId, status });
  const enriched = await tarefaRepository.findByIdAndUserId(id, usuarioId);
  return toTarefaResponseDto(enriched);
}

async function remove({ id, usuarioId }) {
  await tarefaOwnershipService.ensureTarefaOwnership(id, usuarioId);
  await tarefaRepository.remove(id, usuarioId);
}

module.exports = {
  create,
  listByUser,
  update,
  setStatus,
  remove
};
