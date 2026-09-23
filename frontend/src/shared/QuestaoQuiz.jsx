import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { respostaService } from '../services/respostaService';

function QuestaoQuiz({ questoes, renderContexto, renderResultado, onConcluir }) {
  const [indice, setIndice] = useState(0);
  const [escolhas, setEscolhas] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [isResponding, setIsResponding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mostrarResultado, setMostrarResultado] = useState(false);

  useEffect(() => {
    setIndice(0);
    setEscolhas({});
    setFeedbacks({});
    setErrorMessage('');
    setMostrarResultado(false);
  }, [questoes]);

  const questaoAtual = questoes[indice] || null;
  const feedbackAtual = questaoAtual ? feedbacks[questaoAtual.id] : null;
  const escolhaAtual = questaoAtual ? escolhas[questaoAtual.id] : null;

  const totalRespondidas = Object.keys(feedbacks).length;
  const totalAcertos = useMemo(
    () => Object.values(feedbacks).filter((feedback) => feedback?.acertou).length,
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
    if (indice < questoes.length - 1) {
      setIndice(indice + 1);
    } else {
      setMostrarResultado(true);
      onConcluir?.({ totalAcertos, total: questoes.length });
    }
  };

  const anterior = () => {
    if (indice > 0) setIndice(indice - 1);
  };

  const refazer = () => {
    setEscolhas({});
    setFeedbacks({});
    setIndice(0);
    setMostrarResultado(false);
  };

  if (!questaoAtual) return null;

  if (concluiuTodas && mostrarResultado) {
    return renderResultado({ totalAcertos, total: questoes.length, feedbacks, refazer });
  }

  return (
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
        {renderContexto ? renderContexto(questaoAtual) : null}
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
          <>
            <div
              className={`feedback ${feedbackAtual.acertou ? 'success' : 'error'}`}
              role="status"
            >
              {feedbackAtual.mensagem}
            </div>

            {!feedbackAtual.acertou && feedbackAtual.alternativa_escolhida?.justificativa ? (
              <div className="justificativa-card justificativa-erro">
                <span className="justificativa-label">Por que essa alternativa está errada</span>
                <p>{feedbackAtual.alternativa_escolhida.justificativa}</p>
              </div>
            ) : null}

            {feedbackAtual.alternativa_correta?.justificativa ? (
              <div className="justificativa-card justificativa-correta">
                <span className="justificativa-label">
                  {feedbackAtual.acertou
                    ? 'Por que sua resposta está correta'
                    : 'Por que a alternativa correta é a certa'}
                </span>
                <p>{feedbackAtual.alternativa_correta.justificativa}</p>
              </div>
            ) : null}

            {!feedbackAtual.alternativa_escolhida?.justificativa &&
            !feedbackAtual.alternativa_correta?.justificativa ? (
              <p className="muted justificativa-empty">
                Sem explicação detalhada para esta questão.
              </p>
            ) : null}
          </>
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
            <button type="button" className="primary-button button-with-spinner" onClick={proxima}>
              <span>{indice < questoes.length - 1 ? 'Próxima' : 'Ver resultado'}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </article>
    </section>
  );
}

export function AssuntoTag({ assunto }) {
  if (!assunto) return null;
  return <span className="assunto-tag">{assunto}</span>;
}

export default QuestaoQuiz;
