import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookmarkCheck, BookmarkMinus, Layers, RotateCw } from 'lucide-react';
import { conteudoService } from '../services/conteudoService';
import { flashcardService } from '../services/flashcardService';
import { useDocumentTitle } from '../shared/useDocumentTitle';

function FlashcardsPage() {
  useDocumentTitle('Flashcards');
  const { conteudoId } = useParams();

  const [conteudo, setConteudo] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [indice, setIndice] = useState(0);
  const [revelado, setRevelado] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isToggling, setIsToggling] = useState(false);

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [conteudoData, flashData] = await Promise.all([
        conteudoService.getById(conteudoId),
        flashcardService.listByConteudo(conteudoId)
      ]);
      setConteudo(conteudoData);
      setFlashcards(flashData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [conteudoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const cardAtual = flashcards[indice] || null;
  const totalRevisados = useMemo(
    () => flashcards.filter((card) => Boolean(card.revisado_em)).length,
    [flashcards]
  );

  const virar = () => setRevelado((atual) => !atual);

  const irPara = (delta) => {
    const novo = indice + delta;
    if (novo < 0 || novo >= flashcards.length) return;
    setIndice(novo);
    setRevelado(false);
  };

  const alternarRevisado = async () => {
    if (!cardAtual) return;
    setIsToggling(true);
    setErrorMessage('');
    try {
      if (cardAtual.revisado_em) {
        await flashcardService.desmarcarRevisado(cardAtual.id);
        setFlashcards((atual) =>
          atual.map((c) => (c.id === cardAtual.id ? { ...c, revisado_em: null } : c))
        );
      } else {
        const resposta = await flashcardService.marcarRevisado(cardAtual.id);
        setFlashcards((atual) =>
          atual.map((c) =>
            c.id === cardAtual.id ? { ...c, revisado_em: resposta.revisado_em } : c
          )
        );
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsToggling(false);
    }
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
          <h1>Flashcards</h1>
          <p className="dashboard-copy">{conteudo?.titulo || 'Carregando...'}</p>
        </div>
      </section>

      {isLoading ? (
        <p>Carregando flashcards...</p>
      ) : flashcards.length === 0 ? (
        <section className="content-card">
          <div className="empty-state">
            <Layers size={36} className="empty-state-svg" aria-hidden="true" />
            <strong>Nenhum flashcard para estudar</strong>
            <p className="muted">
              Volte ao conteúdo e clique em <strong>Gerar estudo</strong> para a IA criar os
              flashcards.
            </p>
            <Link to={`/conteudos/${conteudoId}`} className="primary-button small button-with-spinner">
              <ArrowLeft size={14} />
              <span>Voltar ao conteúdo</span>
            </Link>
          </div>
        </section>
      ) : (
        <section className="content-card">
          <header className="quiz-header">
            <span>
              Flashcard {indice + 1} de {flashcards.length}
            </span>
            <span className="quiz-score">
              {totalRevisados} revisados de {flashcards.length}
            </span>
          </header>

          <div className="progress-track flashcard-progress">
            <div
              className="progress-fill good"
              style={{ width: `${(totalRevisados / flashcards.length) * 100}%` }}
            />
          </div>

          {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

          <div
            className={`flashcard-3d-wrapper ${cardAtual.revisado_em ? 'reviewed' : ''}`}
            onClick={virar}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                virar();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Virar flashcard"
          >
            <div className={`flashcard-3d ${revelado ? 'flipped' : ''}`}>
              <div className="flashcard-face flashcard-face-front">
                <span className="flashcard-label">Pergunta</span>
                <p>{cardAtual.frente}</p>
                <span className="flashcard-hint flashcard-hint-center">
                  <RotateCw size={14} aria-hidden="true" /> Clique para virar
                </span>
              </div>
              <div className="flashcard-face flashcard-face-back">
                <span className="flashcard-label">Resposta</span>
                <p>{cardAtual.verso}</p>
                <span className="flashcard-hint flashcard-hint-center">
                  <RotateCw size={14} aria-hidden="true" /> Clique para voltar
                </span>
              </div>
            </div>
          </div>

          <div className="quiz-actions">
            <button
              type="button"
              className="secondary-button small quiz-nav button-with-spinner"
              onClick={() => irPara(-1)}
              disabled={indice === 0}
            >
              <ArrowLeft size={14} />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              className={`${cardAtual.revisado_em ? 'secondary-button' : 'primary-button'} button-with-spinner`}
              onClick={alternarRevisado}
              disabled={isToggling}
            >
              {isToggling ? (
                <span>Salvando...</span>
              ) : cardAtual.revisado_em ? (
                <>
                  <BookmarkMinus size={16} />
                  <span>Desmarcar revisado</span>
                </>
              ) : (
                <>
                  <BookmarkCheck size={16} />
                  <span>Marcar como revisado</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="secondary-button small quiz-nav button-with-spinner"
              onClick={() => irPara(1)}
              disabled={indice === flashcards.length - 1}
            >
              <span>Próximo</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {cardAtual.revisado_em ? (
            <p className="muted center">
              Revisado em {new Date(cardAtual.revisado_em).toLocaleString('pt-BR')}
            </p>
          ) : null}
        </section>
      )}
    </main>
  );
}

export default FlashcardsPage;
