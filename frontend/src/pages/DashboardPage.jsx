import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, ListTodo, Plus, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { materiaService } from '../services/materiaService';
import { tarefaService } from '../services/tarefaService';
import { desempenhoService } from '../services/desempenhoService';
import { painelService } from '../services/painelService';
import { proximoPassoService } from '../services/proximoPassoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import PainelOrientacao from '../shared/PainelOrientacao';
import ProximoPasso from '../shared/ProximoPasso';

function DashboardPage() {
  useDocumentTitle('Início');
  const { usuario } = useAuth();

  const [materias, setMaterias] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [desempenho, setDesempenho] = useState(null);
  const [painel, setPainel] = useState(null);
  const [proximoPasso, setProximoPasso] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [materiasData, tarefasData, desempenhoData, painelData, passoData] = await Promise.all([
        materiaService.listMaterias(),
        tarefaService.listAll().catch(() => []),
        desempenhoService.get({ dias: 30 }).catch(() => null),
        painelService.get().catch(() => null),
        proximoPassoService.get().catch(() => null)
      ]);
      setMaterias(materiasData);
      setTarefas(tarefasData);
      setDesempenho(desempenhoData);
      setPainel(painelData);
      setProximoPasso(passoData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const tarefasUrgentes = useMemo(
    () =>
      tarefas.filter(
        (t) => t.status !== 'concluida' && (t.urgencia === 'vencida' || t.urgencia === 'urgente')
      ),
    [tarefas]
  );

  const taxaBruta = desempenho?.resumo?.taxa_acerto ?? null;
  const taxaAcerto = taxaBruta === null ? null : Math.round(taxaBruta);
  const totalRespostas = desempenho?.resumo?.total_respostas ?? 0;
  const emOnboarding = !isLoading && proximoPasso !== null && !proximoPasso.concluida;

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero dashboard-hero-compact">
        <div className="dashboard-hero-content">
          <p className="eyebrow">StudyAI</p>
          <h1>Olá, {usuario?.nome?.split(' ')[0] || 'estudante'}</h1>
          <p className="dashboard-copy">
            {emOnboarding
              ? 'Siga os passos abaixo para o StudyAI começar a recomendar o que estudar.'
              : 'Aqui está o resumo do seu estudo e o que vale fazer agora.'}
          </p>
          <div className="stat-chips">
            <Link to="/materias" className="stat-chip link">
              <BookOpen size={14} />
              <strong>{materias.length}</strong> matérias
            </Link>
            <Link
              to="/tarefas"
              className={`stat-chip link ${tarefasUrgentes.length > 0 ? 'warn' : 'neutral'}`}
            >
              {tarefasUrgentes.length > 0 ? <AlertCircle size={14} /> : <ListTodo size={14} />}
              <strong>{tarefasUrgentes.length}</strong> tarefas urgentes
            </Link>
            <Link
              to="/desempenho"
              className={`stat-chip link ${totalRespostas > 0 ? 'success' : 'neutral'}`}
            >
              <Target size={14} />
              {totalRespostas > 0 ? (
                <>
                  <strong>{taxaAcerto}%</strong> de acerto
                </>
              ) : (
                <span>Sem dados de acerto ainda</span>
              )}
            </Link>
          </div>
        </div>
        <div className="dashboard-hero-decoration" aria-hidden="true" />
      </section>

      {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

      {emOnboarding ? (
        <ProximoPasso passo={proximoPasso} comTrilha />
      ) : (
        <PainelOrientacao painel={painel} isLoading={isLoading} />
      )}

    </main>
  );
}

export default DashboardPage;
