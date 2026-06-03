import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  Pencil,
  Plus,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { SkeletonList } from '../shared/Skeleton';
import { tarefaService } from '../services/tarefaService';
import { materiaService } from '../services/materiaService';
import { useDocumentTitle } from '../shared/useDocumentTitle';

const URGENCIA_LABEL = {
  vencida: 'Vencida',
  urgente: 'Urgente',
  proxima: 'Em breve',
  normal: 'No prazo',
  concluida: 'Concluída'
};

function diasRestantesLabel(tarefa) {
  if (tarefa.status === 'concluida') return 'Concluída';
  if (tarefa.dias_restantes === null) return '';
  if (tarefa.dias_restantes < 0) {
    const abs = Math.abs(tarefa.dias_restantes);
    return `${abs} ${abs === 1 ? 'dia em atraso' : 'dias em atraso'}`;
  }
  if (tarefa.dias_restantes === 0) return 'Vence hoje';
  if (tarefa.dias_restantes === 1) return 'Vence amanhã';
  return `${tarefa.dias_restantes} dias restantes`;
}

const FORM_INICIAL = { titulo: '', descricao: '', data_limite: '', materia_id: '' };

function TarefasPage() {
  useDocumentTitle('Tarefas de estudo');

  const [tarefas, setTarefas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [tarefasData, materiasData] = await Promise.all([
        tarefaService.listAll(),
        materiaService.listMaterias()
      ]);
      setTarefas(tarefasData);
      setMaterias(materiasData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((atual) => ({ ...atual, [name]: value }));
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setFormData(FORM_INICIAL);
    setFormError('');
  };

  const iniciarEdicao = (tarefa) => {
    setEditandoId(tarefa.id);
    setFormData({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || '',
      data_limite: tarefa.data_limite ? tarefa.data_limite.slice(0, 10) : '',
      materia_id: tarefa.materia_id ? String(tarefa.materia_id) : ''
    });
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setIsSaving(true);

    const payload = {
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      data_limite: formData.data_limite,
      materia_id: formData.materia_id ? Number(formData.materia_id) : null
    };

    try {
      if (editandoId) {
        await tarefaService.update(editandoId, payload);
      } else {
        await tarefaService.create(payload);
      }
      cancelarEdicao();
      await carregar();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const concluir = async (tarefa) => {
    setErrorMessage('');
    try {
      const novoStatus = tarefa.status === 'concluida' ? 'pendente' : 'concluida';
      await tarefaService.setStatus(tarefa.id, novoStatus);
      await carregar();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const excluir = async (tarefa) => {
    if (!window.confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) return;
    setErrorMessage('');
    try {
      await tarefaService.remove(tarefa.id);
      if (editandoId === tarefa.id) cancelarEdicao();
      await carregar();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const { urgentes, demais } = useMemo(() => {
    const urg = [];
    const out = [];
    tarefas.forEach((t) => {
      if (t.status !== 'concluida' && (t.urgencia === 'vencida' || t.urgencia === 'urgente')) {
        urg.push(t);
      } else {
        out.push(t);
      }
    });
    return { urgentes: urg, demais: out };
  }, [tarefas]);

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            <Link to="/dashboard" className="back-link">
              <ArrowLeft size={14} /> Dashboard
            </Link>
          </p>
          <h1>Tarefas de estudo</h1>
          <p className="dashboard-copy">
            Organize seus prazos e acompanhe o que está urgente.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <article className="content-card">
          <h2>{editandoId ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Título</span>
              <input
                name="titulo"
                type="text"
                placeholder="Ex: Revisar Direito Constitucional"
                value={formData.titulo}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className="field">
              <span>Descrição</span>
              <input
                name="descricao"
                type="text"
                placeholder="Opcional"
                value={formData.descricao}
                onChange={handleInputChange}
              />
            </label>
            <label className="field">
              <span>Data limite</span>
              <input
                name="data_limite"
                type="date"
                value={formData.data_limite}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className="field">
              <span>Matéria</span>
              <select
                name="materia_id"
                value={formData.materia_id}
                onChange={handleInputChange}
              >
                <option value="">Sem matéria</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
            {formError ? <p className="feedback error">{formError}</p> : null}
            <div className="form-actions">
              <button type="submit" className="primary-button button-with-spinner" disabled={isSaving}>
                {isSaving ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>{editandoId ? 'Salvar alterações' : 'Criar tarefa'}</span>
                  </>
                )}
              </button>
              {editandoId ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelarEdicao}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="content-card">
          <h2>Suas tarefas</h2>
          {isLoading ? <SkeletonList items={4} lines={3} /> : null}
          {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

          {!isLoading && tarefas.length === 0 ? (
            <div className="empty-state">
              <ListTodo size={36} className="empty-state-svg" aria-hidden="true" />
              <strong>Nenhuma tarefa ainda</strong>
              <p className="muted">
                Use o formulário ao lado para criar sua primeira tarefa de estudo e organizar
                prazos.
              </p>
            </div>
          ) : null}

          {urgentes.length > 0 ? (
            <div className="task-section urgent">
              <h3>
                <AlertTriangle size={16} /> Atenção — prazos críticos
              </h3>
              <ul className="task-list">
                {urgentes.map((tarefa) => (
                  <TaskItem
                    key={tarefa.id}
                    tarefa={tarefa}
                    onEdit={iniciarEdicao}
                    onConcluir={concluir}
                    onExcluir={excluir}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {demais.length > 0 ? (
            <ul className="task-list">
              {demais.map((tarefa) => (
                <TaskItem
                  key={tarefa.id}
                  tarefa={tarefa}
                  onEdit={iniciarEdicao}
                  onConcluir={concluir}
                  onExcluir={excluir}
                />
              ))}
            </ul>
          ) : null}
        </article>
      </section>
    </main>
  );
}

function TaskItem({ tarefa, onEdit, onConcluir, onExcluir }) {
  const concluida = tarefa.status === 'concluida';
  return (
    <li className={`task-item urgencia-${tarefa.urgencia}`}>
      <div className="task-main">
        <div className="task-header">
          <strong className={concluida ? 'task-title done' : 'task-title'}>{tarefa.titulo}</strong>
          <span className={`task-badge urgencia-${tarefa.urgencia}`}>
            {tarefa.urgencia === 'vencida' || tarefa.urgencia === 'urgente' ? (
              <AlertCircle size={12} aria-hidden="true" />
            ) : null}
            {URGENCIA_LABEL[tarefa.urgencia]}
          </span>
        </div>
        {tarefa.descricao ? <p className="task-desc">{tarefa.descricao}</p> : null}
        <div className="task-meta">
          <span>
            Prazo:{' '}
            {tarefa.data_limite
              ? new Date(tarefa.data_limite).toLocaleDateString('pt-BR')
              : '—'}
          </span>
          <span>{diasRestantesLabel(tarefa)}</span>
          {tarefa.materia_nome ? <span>Matéria: {tarefa.materia_nome}</span> : null}
        </div>
      </div>
      <div className="task-actions">
        <button
          type="button"
          className="secondary-button small button-with-spinner"
          onClick={() => onConcluir(tarefa)}
          aria-label={concluida ? 'Reabrir tarefa' : 'Concluir tarefa'}
        >
          {concluida ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
          <span>{concluida ? 'Reabrir' : 'Concluir'}</span>
        </button>
        <button
          type="button"
          className="secondary-button small button-with-spinner"
          onClick={() => onEdit(tarefa)}
          aria-label="Editar tarefa"
        >
          <Pencil size={14} />
          <span>Editar</span>
        </button>
        <button
          type="button"
          className="secondary-button small danger button-with-spinner"
          onClick={() => onExcluir(tarefa)}
          aria-label="Excluir tarefa"
        >
          <Trash2 size={14} />
          <span>Excluir</span>
        </button>
      </div>
    </li>
  );
}

export default TarefasPage;
