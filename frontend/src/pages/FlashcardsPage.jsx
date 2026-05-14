import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { conteudoService } from '../services/conteudoService';
import { flashcardService } from '../services/flashcardService';
import { useDocumentTitle } from '../shared/useDocumentTitle';

function FlashcardsPage() {
  useDocumentTitle('Flashcards');
  const { conteudoId } = useParams();
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();

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
          <h1>Flashcards</h1>
          <p className="dashboard-copy">{conteudo?.titulo || 'Carregando...'}</p>
          <span className="user-chip">{usuario?.nome}</span>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          Sair
        </button>
      </section>

      {isLoading ? (
        <p>Carregando flashcards...</p>
      ) : flashcards.length === 0 ? (
        <section className="content-card">
          <p className="muted">
            Nenhum flashcard gerado para este conteúdo. Volte ao conteúdo e gere o material com IA.
          </p>
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

          {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

          <button
            type="button"
            className={`flashcard flashcard-large ${revelado ? 'revealed' : ''} ${
              cardAtual.revisado_em ? 'reviewed' : ''
            }`}
            onClick={virar}
          >
            <span className="flashcard-label">{revelado ? 'Resposta' : 'Pergunta'}</span>
            <p>{revelado ? cardAtual.verso : cardAtual.frente}</p>
            <span className="flashcard-hint">Clique para virar</span>
          </button>

          <div className="quiz-actions">
            <button
              type="button"
              className="secondary-button small"
              onClick={() => irPara(-1)}
              disabled={indice === 0}
            >
              Anterior
            </button>

            <button
              type="button"
              className={cardAtual.revisado_em ? 'secondary-button' : 'primary-button'}
              onClick={alternarRevisado}
              disabled={isToggling}
            >
              {isToggling
                ? 'Salvando...'
                : cardAtual.revisado_em
                  ? 'Desmarcar revisado'
                  : 'Marcar como revisado'}
            </button>

            <button
              type="button"
              className="secondary-button small"
              onClick={() => irPara(1)}
              disabled={indice === flashcards.length - 1}
            >
              Próximo
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
