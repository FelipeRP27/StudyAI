import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { materiaService } from '../services/materiaService';

function DashboardPage() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [isLoadingMaterias, setIsLoadingMaterias] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadMaterias() {
      setIsLoadingMaterias(true);
      setErrorMessage('');

      try {
        const response = await materiaService.listMaterias();

        if (isMounted) {
          setMaterias(response);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMaterias(false);
        }
      }
    }

    loadMaterias();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Sprint 2</p>
          <h1>Dashboard base do StudyAI</h1>
          <p className="dashboard-copy">
            Esta tela esta conectada ao backend e pronta para evoluir com os modulos das proximas
            sprints.
          </p>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          Sair
        </button>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Usuario autenticado</h2>
          <p>{usuario?.nome || 'Usuario'}</p>
          <span>{usuario?.email || 'email nao disponivel'}</span>
        </article>

        <article className="dashboard-card">
          <h2>Integracao com backend</h2>
          <p>Cliente HTTP centralizado em services com JWT automatico.</p>
          <span>Base URL configuravel por variavel de ambiente.</span>
        </article>

        <article className="dashboard-card">
          <h2>Materias do usuario</h2>
          {isLoadingMaterias ? <p>Carregando materias...</p> : null}
          {!isLoadingMaterias && errorMessage ? <p>{errorMessage}</p> : null}
          {!isLoadingMaterias && !errorMessage && materias.length === 0 ? (
            <p>Nenhuma materia cadastrada ainda.</p>
          ) : null}
          {!isLoadingMaterias && !errorMessage && materias.length > 0 ? (
            <ul className="matter-list">
              {materias.map((materia) => (
                <li key={materia.id} className="matter-item">
                  <strong>{materia.nome}</strong>
                  <span>{materia.descricao || 'Sem descricao cadastrada.'}</span>
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
