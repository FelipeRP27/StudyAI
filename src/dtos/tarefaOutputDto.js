const MS_POR_DIA = 1000 * 60 * 60 * 24;

function calcularDiasRestantes(dataLimite, hoje = new Date()) {
  if (!dataLimite) return null;
  const limite = new Date(dataLimite);
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fim = new Date(limite.getFullYear(), limite.getMonth(), limite.getDate());
  return Math.round((fim.getTime() - inicio.getTime()) / MS_POR_DIA);
}

function calcularUrgencia({ status, diasRestantes }) {
  if (status === 'concluida') return 'concluida';
  if (diasRestantes === null) return 'normal';
  if (diasRestantes < 0) return 'vencida';
  if (diasRestantes <= 3) return 'urgente';
  if (diasRestantes <= 7) return 'proxima';
  return 'normal';
}

function toTarefaResponseDto(tarefa, hoje = new Date()) {
  const diasRestantes = calcularDiasRestantes(tarefa.data_limite, hoje);
  const urgencia = calcularUrgencia({
    status: tarefa.status,
    diasRestantes
  });

  return {
    id: tarefa.id,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao,
    data_limite: tarefa.data_limite,
    status: tarefa.status,
    materia_id: tarefa.materia_id,
    materia_nome: tarefa.materia_nome || null,
    created_at: tarefa.created_at,
    concluida_em: tarefa.concluida_em,
    dias_restantes: diasRestantes,
    urgencia
  };
}

function toTarefaListResponseDto(tarefas) {
  const hoje = new Date();
  return tarefas.map((tarefa) => toTarefaResponseDto(tarefa, hoje));
}

module.exports = {
  toTarefaResponseDto,
  toTarefaListResponseDto,
  calcularDiasRestantes,
  calcularUrgencia
};
