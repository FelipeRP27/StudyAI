import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, ListTodo, Plus, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { materiaService } from '../services/materiaService';
import { tarefaService } from '../services/tarefaService';
import { desempenhoService } from '../services/desempenhoService';
import { painelService } from '../services/painelService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import PainelOrientacao from '../shared/PainelOrientacao';

function DashboardPage() {
  useDocumentTitle('Início');
  const { usuario } = useAuth();

  const [materias, setMaterias] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [desempenho, setDesempenho] = useState(null);
  const [painel, setPainel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [materiasData, tarefasData, desempenhoData, painelData] = await Promise.all([
        materiaService.listMaterias(),
        tarefaService.listAll().catch(() => []),
        desempenhoService.get({ dias: 30 }).catch(() => null),
        painelService.get().catch(() => null)
      ]);
      setMaterias(materiasData);
      setTarefas(tarefasData);
      setDesempenho(desempenhoData);
      setPainel(painelData);
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
  const semMaterias = !isLoading && materias.length === 0;

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero dashboard-hero-compact">
        <div className="dashboard-hero-content">
          <p className="eyebrow">StudyAI</p>
          <h1>Olá, {usuario?.nome?.split(' ')[0] || 'estudante'}</h1>
          <p className="dashboard-copy">
            {semMaterias
              ? 'Crie sua primeira matéria para o StudyAI gerar material de estudo e acompanhar seu desempenho.'
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

      {semMaterias ? (
        <section className="content-card">
          <div className="empty-state">
            <BookOpen size={36} className="empty-state-svg" aria-hidden="true" />
            <strong>Comece criando sua primeira matéria</strong>
            <p className="muted">
              Depois é só colar um texto ou anexar um PDF: a IA gera resumo, pontos-chave, questões e
              flashcards para você estudar.
            </p>
            <Link to="/materias" className="primary-button">
              <Plus size={16} />
              <span>Criar matéria</span>
            </Link>
          </div>
        </section>
      ) : (
        <PainelOrientacao painel={painel} isLoading={isLoading} />
      )}
    </main>
  );
}

export default DashboardPage;
