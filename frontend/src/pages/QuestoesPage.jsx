import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpenCheck, RotateCcw, Trophy } from 'lucide-react';
import Skeleton, { SkeletonText } from '../shared/Skeleton';
import { conteudoService } from '../services/conteudoService';
import { questaoService } from '../services/questaoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import { respostaService } from '../services/respostaService';

function QuestoesPage() {
  useDocumentTitle('Resolver questões');
  const { conteudoId } = useParams();

  const [conteudo, setConteudo] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [indice, setIndice] = useState(0);
  const [escolhas, setEscolhas] = useState({});
  const [feedbacks, setFeedbacks] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);

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

  const questaoAtual = questoes[indice] || null;
  const feedbackAtual = questaoAtual ? feedbacks[questaoAtual.id] : null;
  const escolhaAtual = questaoAtual ? escolhas[questaoAtual.id] : null;

  const totalRespondidas = Object.keys(feedbacks).length;
  const totalAcertos = useMemo(
    () => Object.values(feedbacks).filter((f) => f?.acertou).length,
    [feedbacks]
  );
  const concluiuTodas = questoes.length > 0 && totalRespondidas === questoes.length;

  const selecionar = (alternativaId) => {
    if (feedbackAtual) return;
    setEscolhas((atual) => ({ ...atual, [questaoAtual.id]: alternativaId }));
  };

  const responder = async () => {
    if (!questaoAtual || !escolhaAtual || feedbackAtual) return;
    setIsResponding(true);
    setErrorMessage('');
    try {
      const resposta = await respostaService.responder({
        questao_id: questaoAtual.id,
        alternativa_id: escolhaAtual
      });
      setFeedbacks((atual) => ({ ...atual, [questaoAtual.id]: resposta.feedback }));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsResponding(false);
    }
  };

  const proxima = () => {
    if (indice < questoes.length - 1) setIndice(indice + 1);
  };

  const anterior = () => {
    if (indice > 0) setIndice(indice - 1);
  };

  const refazer = () => {
    setEscolhas({});
    setFeedbacks({});
    setIndice(0);
  };

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
          <p className="dashboard-copy">
            {conteudo?.titulo || 'Carregando...'}
          </p>
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
      ) : concluiuTodas ? (
        <section className="content-card quiz-summary">
          <Trophy size={56} className="quiz-summary-icon" aria-hidden="true" />
          <h2>Você concluiu todas as questões!</h2>
          <p className="quiz-summary-score">
            <strong>{totalAcertos}</strong> de <strong>{questoes.length}</strong> corretas (
            {Math.round((totalAcertos / questoes.length) * 100)}% de acerto)
          </p>
          <div className="quiz-summary-actions">
            <button type="button" className="secondary-button button-with-spinner" onClick={refazer}>
              <RotateCcw size={16} />
              <span>Refazer</span>
            </button>
            <Link to={`/conteudos/${conteudoId}`} className="secondary-button button-with-spinner">
              <ArrowLeft size={16} />
              <span>Voltar ao conteúdo</span>
            </Link>
            <Link to="/desempenho" className="primary-button button-with-spinner">
              <span>Ver desempenho</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : (
        <section className="content-card">
          <header className="quiz-header">
            <span>
              Questão {indice + 1} de {questoes.length}
            </span>
            <span className="quiz-score">
              {totalAcertos} acertos / {totalRespondidas} respondidas
            </span>
          </header>

          {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

          <article className="card-inner">
            <strong>{questaoAtual.enunciado}</strong>
            <ul className="alt-list">
              {questaoAtual.alternativas.map((alt, altIdx) => {
                const letra = String.fromCharCode(65 + altIdx);
                const selecionada = escolhaAtual === alt.id;
                let classe = 'alt-item';

                if (feedbackAtual) {
                  const isCorreta = feedbackAtual.alternativa_correta?.id === alt.id;
                  if (isCorreta) classe += ' correct';
                  else if (selecionada) classe += ' wrong';
                } else if (selecionada) {
                  classe += ' selected';
                }

                return (
                  <li key={alt.id} className={classe}>
                    <button
                      type="button"
                      onClick={() => selecionar(alt.id)}
                      disabled={Boolean(feedbackAtual) || isResponding}
                    >
                      <span className="letra">{letra})</span> {alt.texto}
                    </button>
                  </li>
                );
              })}
            </ul>

            {feedbackAtual ? (
              <div
                className={`feedback ${feedbackAtual.acertou ? 'success' : 'error'}`}
                role="status"
              >
                {feedbackAtual.mensagem}
              </div>
            ) : null}

            <div className="quiz-actions">
              <button
                type="button"
                className="secondary-button small quiz-nav button-with-spinner"
                onClick={anterior}
                disabled={indice === 0}
              >
                <ArrowLeft size={14} />
                <span>Anterior</span>
              </button>

              {!feedbackAtual ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={responder}
                  disabled={!escolhaAtual || isResponding}
                >
                  {isResponding ? 'Enviando...' : 'Responder'}
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button button-with-spinner"
                  onClick={proxima}
                >
                  <span>{indice === questoes.length - 1 ? 'Ver resultado' : 'Próxima'}</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </article>
        </section>
      )}
    </main>
  );
}

export default QuestoesPage;
