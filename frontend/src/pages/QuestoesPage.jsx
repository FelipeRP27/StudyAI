import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { conteudoService } from '../services/conteudoService';
import { questaoService } from '../services/questaoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import { respostaService } from '../services/respostaService';

function QuestoesPage() {
  useDocumentTitle('Resolver questões');
  const { conteudoId } = useParams();
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            <Link to={`/conteudos/${conteudoId}`}>← Voltar ao conteúdo</Link>
          </p>
          <h1>Resolver questões</h1>
          <p className="dashboard-copy">
            {conteudo?.titulo || 'Carregando...'}
          </p>
          <span className="user-chip">{usuario?.nome}</span>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          Sair
        </button>
      </section>

      {isLoading ? (
        <p>Carregando questões...</p>
      ) : errorMessage && questoes.length === 0 ? (
        <p className="feedback error">{errorMessage}</p>
      ) : questoes.length === 0 ? (
        <section className="content-card">
          <p className="muted">
            Nenhuma questão gerada para este conteúdo. Volte ao conteúdo e gere o material com IA.
          </p>
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
                className="secondary-button small"
                onClick={anterior}
                disabled={indice === 0}
              >
                Anterior
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
                  className="primary-button"
                  onClick={proxima}
                  disabled={indice === questoes.length - 1}
                >
                  Próxima
                </button>
              )}
            </div>
          </article>

          {concluiuTodas ? (
            <div className="quiz-finished">
              <strong>Você respondeu todas as questões!</strong>
              <span>
                Acertou {totalAcertos} de {questoes.length} (
                {Math.round((totalAcertos / questoes.length) * 100)}%).
              </span>
              <Link to="/desempenho" className="primary-button small">
                Ver desempenho
              </Link>
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}

export default QuestoesPage;
