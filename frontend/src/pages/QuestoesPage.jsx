import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpenCheck, NotebookPen, RotateCcw, Trophy } from 'lucide-react';
import Skeleton, { SkeletonText } from '../shared/Skeleton';
import QuestaoQuiz, { AssuntoTag } from '../shared/QuestaoQuiz';
import { conteudoService } from '../services/conteudoService';
import { questaoService } from '../services/questaoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import { useRegistroDeEstudo } from '../shared/useRegistroDeEstudo';

function QuestoesPage() {
  useDocumentTitle('Resolver questões');
  const { conteudoId } = useParams();
  useRegistroDeEstudo(conteudoId, 'questoes');

  const [conteudo, setConteudo] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [conteudoData, questoesData] = await Promise.all([
        conteudoService.getById(conteudoId),
        questaoService.listByConteudo(conteudoId)
      ]);
      setConteudo(conteudoData);
      setQuestoes(questoesData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [conteudoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const renderResultado = ({ totalAcertos, total, refazer }) => (
    <section className="content-card quiz-summary">
      <Trophy size={56} className="quiz-summary-icon" aria-hidden="true" />
      <h2>Você concluiu todas as questões!</h2>
      <p className="quiz-summary-score">
        <strong>{totalAcertos}</strong> de <strong>{total}</strong> corretas (
        {Math.round((totalAcertos / total) * 100)}% de acerto)
      </p>
      <div className="quiz-summary-actions">
        <button type="button" className="secondary-button button-with-spinner" onClick={refazer}>
          <RotateCcw size={16} />
          <span>Refazer</span>
        </button>
        {totalAcertos < total ? (
          <Link
            to={`/erros?conteudo_id=${conteudoId}`}
            className="secondary-button button-with-spinner"
          >
            <NotebookPen size={16} />
            <span>Ver caderno de erros</span>
          </Link>
        ) : (
          <Link to={`/conteudos/${conteudoId}`} className="secondary-button button-with-spinner">
            <ArrowLeft size={16} />
            <span>Voltar ao conteúdo</span>
          </Link>
        )}
        <Link to="/desempenho" className="primary-button button-with-spinner">
          <span>Ver desempenho</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            <Link to={`/conteudos/${conteudoId}`} className="back-link">
              <ArrowLeft size={14} /> Voltar ao conteúdo
            </Link>
          </p>
          <h1>Resolver questões</h1>
          <p className="dashboard-copy">{conteudo?.titulo || 'Carregando...'}</p>
        </div>
      </section>

      {isLoading ? (
        <section className="content-card">
          <Skeleton width="35%" height="1.1rem" />
          <div style={{ marginTop: 18 }}>
            <SkeletonText lines={2} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton height="44px" />
            <Skeleton height="44px" />
            <Skeleton height="44px" />
            <Skeleton height="44px" />
          </div>
        </section>
      ) : errorMessage && questoes.length === 0 ? (
        <p className="feedback error">{errorMessage}</p>
      ) : questoes.length === 0 ? (
        <section className="content-card">
          <div className="empty-state">
            <BookOpenCheck size={36} className="empty-state-svg" aria-hidden="true" />
            <strong>Nenhuma questão para resolver</strong>
            <p className="muted">
              Volte ao conteúdo e clique em <strong>Gerar estudo</strong> para a IA criar as
              questões.
            </p>
            <Link to={`/conteudos/${conteudoId}`} className="primary-button small button-with-spinner">
              <ArrowLeft size={14} />
              <span>Voltar ao conteúdo</span>
            </Link>
          </div>
        </section>
      ) : (
        <QuestaoQuiz
          questoes={questoes}
          renderContexto={(questao) =>
            questao.assunto ? (
              <div className="quiz-contexto">
                <AssuntoTag assunto={questao.assunto} />
              </div>
            ) : null
          }
          renderResultado={renderResultado}
        />
      )}
    </main>
  );
}

export default QuestoesPage;
