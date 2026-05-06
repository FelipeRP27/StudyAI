import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { materiaService } from '../services/materiaService';

function DashboardPage() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [materias, setMaterias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadMaterias = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await materiaService.listMaterias();
      setMaterias(response);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterias();
  }, [loadMaterias]);

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
      await loadMaterias();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">StudyAI</p>
          <h1>Ola, {usuario?.nome?.split(' ')[0] || 'estudante'}</h1>
          <p className="dashboard-copy">
            Organize suas materias e gere resumos, pontos-chave, questoes e flashcards com IA.
          </p>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          Sair
        </button>
      </section>

      <section className="shortcut-grid">
        <Link to="/tarefas" className="shortcut-card">
          <span className="eyebrow">Organizacao</span>
          <strong>Tarefas de estudo</strong>
          <span className="muted">Crie prazos, veja o que esta urgente.</span>
        </Link>
        <Link to="/desempenho" className="shortcut-card">
          <span className="eyebrow">Acompanhamento</span>
          <strong>Seu desempenho</strong>
          <span className="muted">Taxa de acerto, evolucao e por materia.</span>
        </Link>
      </section>

      <section className="content-grid">
        <article className="content-card">
          <h2>Nova materia</h2>
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
              <span>Descricao</span>
              <input
                name="descricao"
                type="text"
                placeholder="Opcional"
                value={formData.descricao}
                onChange={handleInputChange}
              />
            </label>
            {createError ? <p className="feedback error">{createError}</p> : null}
            <button type="submit" className="primary-button" disabled={isCreating}>
              {isCreating ? 'Salvando...' : 'Criar materia'}
            </button>
          </form>
        </article>

        <article className="content-card">
          <h2>Suas materias</h2>
          {isLoading ? <p>Carregando materias...</p> : null}
          {!isLoading && errorMessage ? <p className="feedback error">{errorMessage}</p> : null}
          {!isLoading && !errorMessage && materias.length === 0 ? (
            <p className="muted">Nenhuma materia cadastrada ainda.</p>
          ) : null}
          {!isLoading && materias.length > 0 ? (
            <ul className="matter-list">
              {materias.map((materia) => (
                <li key={materia.id} className="matter-item">
                  <Link to={`/materias/${materia.id}`}>
                    <strong>{materia.nome}</strong>
                    <span>{materia.descricao || 'Sem descricao cadastrada.'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>
    </main>
  );
}

export default DashboardPage;
