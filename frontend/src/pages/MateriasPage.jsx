import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Plus, X } from 'lucide-react';
import { materiaService } from '../services/materiaService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import { SkeletonList } from '../shared/Skeleton';
import { getMateriaStripe } from '../shared/colorPalette';
import PageHeader from '../shared/PageHeader';

function MateriasPage() {
  useDocumentTitle('Matérias');
  const navigate = useNavigate();

  const [materias, setMaterias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [formAberto, setFormAberto] = useState(false);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setMaterias(await materiaService.listMaterias());
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
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const fecharFormulario = () => {
    setFormAberto(false);
    setFormData({ nome: '', descricao: '' });
    setCreateError('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreateError('');
    setIsCreating(true);

    try {
      const criada = await materiaService.create({
        nome: formData.nome,
        descricao: formData.descricao
      });
      fecharFormulario();
      navigate(`/materias/${criada.id}`);
      return;
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const semMaterias = !isLoading && !errorMessage && materias.length === 0;

  return (
    <main className="dashboard-page">
      <PageHeader
        voltarPara="/dashboard"
        voltarRotulo="Início"
        titulo="Matérias"
        descricao="Organize seu edital em matérias e guarde dentro delas os conteúdos que vai estudar."
        acoes={
          !formAberto ? (
            <button type="button" className="primary-button small" onClick={() => setFormAberto(true)}>
              <Plus size={16} />
              <span>Nova matéria</span>
            </button>
          ) : null
        }
      />

      {formAberto ? (
        <section className="content-card form-card">
          <div className="form-card-header">
            <h2 className="card-heading">
              <span className="card-heading-icon" aria-hidden="true">
                <Plus size={18} />
              </span>
              Nova matéria
            </h2>
            <button
              type="button"
              className="icon-button"
              onClick={fecharFormulario}
              aria-label="Fechar formulário"
            >
              <X size={18} />
            </button>
          </div>
          <form className="form form-inline-grid" onSubmit={handleCreate}>
            <label className="field">
              <span>Nome</span>
              <input
                name="nome"
                type="text"
                placeholder="Ex: Direito Administrativo"
                value={formData.nome}
                onChange={handleInputChange}
                autoFocus
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
            {createError ? <p className="feedback error form-grid-full">{createError}</p> : null}
            <div className="form-actions form-grid-full">
              <button
                type="submit"
                className="primary-button button-with-spinner"
                disabled={isCreating}
              >
                {isCreating ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Criar matéria</span>
                  </>
                )}
              </button>
              <button type="button" className="ghost-button" onClick={fecharFormulario}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="content-card">
        <h2 className="card-heading">
          <span className="card-heading-icon" aria-hidden="true">
            <BookOpen size={18} />
          </span>
          Suas matérias
          {materias.length > 0 ? <span className="card-heading-count">{materias.length}</span> : null}
        </h2>

        {isLoading ? <SkeletonList items={3} /> : null}
        {!isLoading && errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

        {semMaterias ? (
          <div className="empty-state">
            <BookOpen size={36} className="empty-state-svg" aria-hidden="true" />
            <strong>Comece criando sua primeira matéria</strong>
            <p className="muted">
              Uma matéria agrupa os conteúdos de uma mesma disciplina — é o primeiro passo para gerar
              material de estudo.
            </p>
            {!formAberto ? (
              <button type="button" className="primary-button" onClick={() => setFormAberto(true)}>
                <Plus size={16} />
                <span>Criar matéria</span>
              </button>
            ) : null}
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
      </section>
    </main>
  );
}

export default MateriasPage;
