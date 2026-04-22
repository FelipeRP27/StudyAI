import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { conteudoService } from '../services/conteudoService';
import { resumoService } from '../services/resumoService';
import { pontoChaveService } from '../services/pontoChaveService';
import { questaoService } from '../services/questaoService';
import { flashcardService } from '../services/flashcardService';
import { processamentoService } from '../services/processamentoService';

const ABAS = [
  { id: 'resumo', titulo: 'Resumo' },
  { id: 'pontos_chave', titulo: 'Pontos-chave' },
  { id: 'questoes', titulo: 'Questoes' },
  { id: 'flashcards', titulo: 'Flashcards' }
];

function StatusBadge({ status }) {
  const classe = `badge badge-${status}`;
  return <span className={classe}>{status}</span>;
}

function ResumoView({ resumos }) {
  if (!resumos || resumos.length === 0) {
    return <p className="muted">Nenhum resumo gerado ainda.</p>;
  }
  return (
    <div className="stack">
      {resumos.map((resumo) => (
        <article key={resumo.id} className="card-inner">
          <p>{resumo.texto}</p>
        </article>
      ))}
    </div>
  );
}

function PontosChaveView({ pontos }) {
  if (!pontos || pontos.length === 0) {
    return <p className="muted">Nenhum ponto-chave gerado ainda.</p>;
  }
  return (
    <ul className="bullet-list">
      {pontos.map((ponto) => (
        <li key={ponto.id}>{ponto.texto}</li>
      ))}
    </ul>
  );
}

function QuestoesView({ questoes }) {
  const [respostas, setRespostas] = useState({});
  const [revelou, setRevelou] = useState({});

  if (!questoes || questoes.length === 0) {
    return <p className="muted">Nenhuma questao gerada ainda.</p>;
  }

  const selecionar = (questaoId, alternativaId) => {
    setRespostas((atual) => ({ ...atual, [questaoId]: alternativaId }));
  };

  const revelar = (questaoId) => {
    setRevelou((atual) => ({ ...atual, [questaoId]: true }));
  };

  return (
    <div className="stack">
      {questoes.map((questao, idx) => (
        <article key={questao.id} className="card-inner">
          <strong>
            Questao {idx + 1}. {questao.enunciado}
          </strong>
          <ul className="alt-list">
            {questao.alternativas.map((alt, altIdx) => {
              const letra = String.fromCharCode(65 + altIdx);
              const selecionada = respostas[questao.id] === alt.id;
              const mostrandoResposta = revelou[questao.id];
              let classe = 'alt-item';
              if (mostrandoResposta) {
                if (alt.is_correta) classe += ' correct';
                else if (selecionada) classe += ' wrong';
              } else if (selecionada) {
                classe += ' selected';
              }
              return (
                <li key={alt.id} className={classe}>
                  <button
                    type="button"
                    onClick={() => selecionar(questao.id, alt.id)}
                    disabled={mostrandoResposta}
                  >
                    <span className="letra">{letra})</span> {alt.texto}
                  </button>
                </li>
              );
            })}
          </ul>
          {!revelou[questao.id] ? (
            <button
              type="button"
              className="secondary-button small"
              onClick={() => revelar(questao.id)}
              disabled={!respostas[questao.id]}
            >
              Verificar resposta
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function FlashcardsView({ flashcards }) {
  const [revelados, setRevelados] = useState({});

  if (!flashcards || flashcards.length === 0) {
    return <p className="muted">Nenhum flashcard gerado ainda.</p>;
  }

  const alternar = (id) => {
    setRevelados((atual) => ({ ...atual, [id]: !atual[id] }));
  };

  return (
    <div className="flashcard-grid">
      {flashcards.map((card) => (
        <button
          key={card.id}
          type="button"
          className={`flashcard ${revelados[card.id] ? 'revealed' : ''}`}
          onClick={() => alternar(card.id)}
        >
          <span className="flashcard-label">{revelados[card.id] ? 'Resposta' : 'Pergunta'}</span>
          <p>{revelados[card.id] ? card.verso : card.frente}</p>
          <span className="flashcard-hint">Clique para virar</span>
        </button>
      ))}
    </div>
  );
}

function ConteudoPage() {
  const { conteudoId } = useParams();
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();

  const [conteudo, setConteudo] = useState(null);
  const [resumos, setResumos] = useState([]);
  const [pontosChave, setPontosChave] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [processamentos, setProcessamentos] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [isGerando, setIsGerando] = useState(false);
  const [gerarError, setGerarError] = useState('');
  const [gerarResumo, setGerarResumo] = useState(null);

  const [abaAtiva, setAbaAtiva] = useState('resumo');

  const carregarMateriais = useCallback(async () => {
    const [conteudoData, resumosData, pontosData, questoesData, flashData, processData] =
      await Promise.all([
        conteudoService.getById(conteudoId),
        resumoService.listByConteudo(conteudoId),
        pontoChaveService.listByConteudo(conteudoId),
        questaoService.listByConteudo(conteudoId),
        flashcardService.listByConteudo(conteudoId),
        processamentoService.listByConteudo(conteudoId)
      ]);

    setConteudo(conteudoData);
    setResumos(resumosData);
    setPontosChave(pontosData);
    setQuestoes(questoesData);
    setFlashcards(flashData);
    setProcessamentos(processData);
  }, [conteudoId]);

  useEffect(() => {
    let ativo = true;

    (async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        await carregarMateriais();
      } catch (error) {
        if (ativo) setErrorMessage(error.message);
      } finally {
        if (ativo) setIsLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [carregarMateriais]);

  const handleGerarEstudo = async () => {
    setIsGerando(true);
    setGerarError('');
    setGerarResumo(null);

    try {
      const resposta = await processamentoService.processarConteudo(conteudoId);
      setGerarResumo(resposta);
      await carregarMateriais();
    } catch (error) {
      setGerarError(error.message);
    } finally {
      setIsGerando(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const contagens = useMemo(
    () => ({
      resumo: resumos.length,
      pontos_chave: pontosChave.length,
      questoes: questoes.length,
      flashcards: flashcards.length
    }),
    [resumos, pontosChave, questoes, flashcards]
  );

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          {conteudo ? (
            <p className="eyebrow">
              <Link to={`/materias/${conteudo.materia_id}`}>← Voltar para materia</Link>
            </p>
          ) : (
            <p className="eyebrow">
              <Link to="/dashboard">← Dashboard</Link>
            </p>
          )}
          <h1>{conteudo?.titulo || 'Carregando conteudo...'}</h1>
          <span className="user-chip">{usuario?.nome}</span>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          Sair
        </button>
      </section>

      {isLoading ? (
        <p>Carregando conteudo...</p>
      ) : errorMessage ? (
        <p className="feedback error">{errorMessage}</p>
      ) : (
        <>
          <section className="content-card">
            <h2>Texto original</h2>
            <p className="conteudo-texto">{conteudo?.texto}</p>
          </section>

          <section className="content-card generator-card">
            <div className="generator-header">
              <div>
                <h2>Gerar material de estudo com IA</h2>
                <p className="muted">
                  Dispara resumo, pontos-chave, questoes e flashcards em uma unica acao.
                </p>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={handleGerarEstudo}
                disabled={isGerando}
              >
                {isGerando ? 'Gerando com IA...' : 'Gerar estudo'}
              </button>
            </div>

            {gerarError ? <p className="feedback error">{gerarError}</p> : null}

            {gerarResumo ? (
              <div className="gen-summary">
                {gerarResumo.tipos_executados.map((tipo) => {
                  const status = gerarResumo.resultados?.[tipo]?.status || 'desconhecido';
                  return (
                    <div key={tipo} className={`gen-summary-item ${status}`}>
                      <span>{tipo}</span>
                      <StatusBadge status={status} />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="content-card">
            <div className="tabs">
              {ABAS.map((aba) => (
                <button
                  key={aba.id}
                  type="button"
                  className={`tab ${abaAtiva === aba.id ? 'active' : ''}`}
                  onClick={() => setAbaAtiva(aba.id)}
                >
                  {aba.titulo}
                  <span className="tab-count">{contagens[aba.id]}</span>
                </button>
              ))}
            </div>

            <div className="tab-content">
              {abaAtiva === 'resumo' && <ResumoView resumos={resumos} />}
              {abaAtiva === 'pontos_chave' && <PontosChaveView pontos={pontosChave} />}
              {abaAtiva === 'questoes' && <QuestoesView questoes={questoes} />}
              {abaAtiva === 'flashcards' && <FlashcardsView flashcards={flashcards} />}
            </div>
          </section>

          {processamentos.length > 0 ? (
            <section className="content-card">
              <h2>Historico de processamento</h2>
              <ul className="history-list">
                {processamentos.slice(0, 10).map((proc) => (
                  <li key={proc.id} className={`history-item ${proc.status}`}>
                    <span className="history-tipo">{proc.tipo}</span>
                    <StatusBadge status={proc.status} />
                    <span className="history-data">
                      {new Date(proc.iniciado_em).toLocaleString('pt-BR')}
                    </span>
                    {proc.erro ? <span className="history-erro">{proc.erro}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

export default ConteudoPage;
