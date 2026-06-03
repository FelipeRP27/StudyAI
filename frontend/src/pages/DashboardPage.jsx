import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  ListTodo,
  Plus,
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { materiaService } from '../services/materiaService';
import { tarefaService } from '../services/tarefaService';
import { desempenhoService } from '../services/desempenhoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import { SkeletonList } from '../shared/Skeleton';
import { getMateriaStripe } from '../shared/colorPalette';

function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { usuario } = useAuth();

  const [materias, setMaterias] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [desempenho, setDesempenho] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [materiasData, tarefasData, desempenhoData] = await Promise.all([
        materiaService.listMaterias(),
        tarefaService.listAll().catch(() => []),
        desempenhoService.get({ dias: 30 }).catch(() => null)
      ]);
      setMaterias(materiasData);
      setTarefas(tarefasData);
      setDesempenho(desempenhoData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreateError('');
    setIsCreating(true);

    try {
      await materiaService.create({
        nome: formData.nome,
        descricao: formData.descricao
      });
      setFormData({ nome: '', descricao: '' });
      await loadAll();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const tarefasUrgentes = useMemo(
    () =>
      tarefas.filter(
        (t) => t.status !== 'concluida' && (t.urgencia === 'vencida' || t.urgencia === 'urgente')
      ),
    [tarefas]
  );

  const taxaAcerto = desempenho?.resumo?.taxa_acerto ?? null;
  const totalRespostas = desempenho?.resumo?.total_respostas ?? 0;

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero dashboard-hero-compact">
        <div className="dashboard-hero-content">
          <p className="eyebrow">StudyAI</p>
          <h1>Olá, {usuario?.nome?.split(' ')[0] || 'estudante'}</h1>
          <p className="dashboard-copy">
            Organize suas matérias e gere resumos, pontos-chave, questões e flashcards com IA.
          </p>
          <div className="stat-chips">
            <span className="stat-chip">
              <BookOpen size={14} />
              <strong>{materias.length}</strong> matérias
            </span>
            <span
              className={`stat-chip ${tarefasUrgentes.length > 0 ? 'warn' : 'neutral'}`}
            >
              {tarefasUrgentes.length > 0 ? <AlertCircle size={14} /> : <ListTodo size={14} />}
              <strong>{tarefasUrgentes.length}</strong> tarefas urgentes
            </span>
            <span className={`stat-chip ${totalRespostas > 0 ? 'success' : 'neutral'}`}>
              <Target size={14} />
              {totalRespostas > 0 ? (
                <>
                  <strong>{taxaAcerto}%</strong> de acerto
                </>
              ) : (
                <span>Sem dados de acerto ainda</span>
              )}
            </span>
          </div>
        </div>
        <div className="dashboard-hero-decoration" aria-hidden="true" />
      </section>

      <section className="content-grid">
        <article className="content-card">
          <h2 className="card-heading">
            <span className="card-heading-icon" aria-hidden="true">
              <Plus size={18} />
            </span>
            Nova matéria
          </h2>
          <form className="form" onSubmit={handleCreate}>
            <label className="field">
              <span>Nome</span>
              <input
                name="nome"
                type="text"
                placeholder="Ex: Direito Administrativo"
                value={formData.nome}
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
            {createError ? <p className="feedback error">{createError}</p> : null}
            <button type="submit" className="primary-button button-with-spinner" disabled={isCreating}>
              {isCreating ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Criar matéria</span>
                </>
              )}
            </button>
          </form>
        </article>

        <article className="content-card">
          <h2 className="card-heading">
            <span className="card-heading-icon" aria-hidden="true">
              <BookOpen size={18} />
            </span>
            Suas matérias
          </h2>
          {isLoading ? <SkeletonList items={3} /> : null}
          {!isLoading && errorMessage ? <p className="feedback error">{errorMessage}</p> : null}
          {!isLoading && !errorMessage && materias.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={36} className="empty-state-svg" aria-hidden="true" />
              <strong>Comece criando sua primeira matéria</strong>
              <p className="muted">
                Use o formulário ao lado para organizar seus conteúdos por área de estudo.
              </p>
            </div>
          ) : null}
          {!isLoading && materias.length > 0 ? (
            <ul className="matter-list">
              {materias.map((materia) => (
                <li
                  key={materia.id}
                  className="matter-item"
                  style={{ '--matter-stripe': getMateriaStripe(materia.id) }}
                >
                  <Link to={`/materias/${materia.id}`}>
                    <div className="matter-item-text">
                      <strong>{materia.nome}</strong>
                      <span>{materia.descricao || 'Sem descrição cadastrada.'}</span>
                    </div>
                    <ChevronRight size={18} className="matter-item-arrow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>

      <section className="shortcut-grid">
        <Link to="/tarefas" className="shortcut-card">
          <div className="shortcut-icon" aria-hidden="true">
            <ListTodo size={22} />
          </div>
          <div>
            <span className="eyebrow">Organização</span>
            <strong>Tarefas de estudo</strong>
            <span className="muted">
              {tarefasUrgentes.length > 0
                ? `${tarefasUrgentes.length} com prazo crítico — veja agora`
                : 'Crie prazos, veja o que está urgente.'}
            </span>
          </div>
          <ArrowRight size={22} className="shortcut-arrow" aria-hidden="true" />
        </Link>
        <Link to="/desempenho" className="shortcut-card">
          <div className="shortcut-icon" aria-hidden="true">
            <BarChart3 size={22} />
          </div>
          <div>
            <span className="eyebrow">Acompanhamento</span>
            <strong>Seu desempenho</strong>
            <span className="muted">
              {totalRespostas > 0
                ? `${totalRespostas} respostas, ${taxaAcerto}% de acerto`
                : 'Comece a responder questões para ver dados aqui.'}
            </span>
          </div>
          <ArrowRight size={22} className="shortcut-arrow" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

export default DashboardPage;
