import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenCheck, FileText, Layers, Lightbulb, Sparkles } from 'lucide-react';
import { conteudoService } from '../services/conteudoService';
import { resumoService } from '../services/resumoService';
import { pontoChaveService } from '../services/pontoChaveService';
import { questaoService } from '../services/questaoService';
import { flashcardService } from '../services/flashcardService';
import { processamentoService } from '../services/processamentoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import CopyButton from '../shared/CopyButton';
import Spinner from '../shared/Spinner';
import Skeleton, { SkeletonText } from '../shared/Skeleton';

const STAGES = ['resumo', 'pontos_chave', 'questoes', 'flashcards'];

const TIPO_LABEL = {
  resumo: 'Resumo',
  pontos_chave: 'Pontos-chave',
  questoes: 'Questões',
  flashcards: 'Flashcards',
  completo: 'Completo'
};

const STATUS_LABEL = {
  pendente: 'Aguardando',
  processando: 'Processando',
  concluido: 'Concluído',
  erro: 'Erro'
};

const ABAS = [
  { id: 'resumo', titulo: TIPO_LABEL.resumo },
  { id: 'pontos_chave', titulo: TIPO_LABEL.pontos_chave },
  { id: 'questoes', titulo: TIPO_LABEL.questoes },
  { id: 'flashcards', titulo: TIPO_LABEL.flashcards }
];

function StatusBadge({ status }) {
  const classe = `badge badge-${status}`;
  return <span className={classe}>{STATUS_LABEL[status] || status}</span>;
}

function ResumoView({ resumos }) {
  if (!resumos || resumos.length === 0) {
    return (
      <div className="empty-state">
        <FileText size={36} className="empty-state-svg" aria-hidden="true" />
        <strong>Resumo ainda não gerado</strong>
        <p className="muted">
          Clique em <strong>Gerar estudo</strong> acima para a IA produzir um resumo deste conteúdo.
        </p>
      </div>
    );
  }
  const textoCopia = resumos.map((r) => r.texto).join('\n\n');
  return (
    <div className="stack">
      <div className="tab-toolbar">
        <CopyButton text={textoCopia} label="Copiar resumo" />
      </div>
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
    return (
      <div className="empty-state">
        <Lightbulb size={36} className="empty-state-svg" aria-hidden="true" />
        <strong>Pontos-chave ainda não gerados</strong>
        <p className="muted">
          A IA vai extrair os tópicos mais importantes deste conteúdo quando você gerar o estudo.
        </p>
      </div>
    );
  }
  const textoCopia = pontos.map((p) => `• ${p.texto}`).join('\n');
  return (
    <div className="stack">
      <div className="tab-toolbar">
        <CopyButton text={textoCopia} label="Copiar pontos-chave" />
      </div>
      <ul className="bullet-list">
        {pontos.map((ponto) => (
          <li key={ponto.id}>{ponto.texto}</li>
        ))}
      </ul>
    </div>
  );
}

function QuestoesView({ questoes, conteudoId }) {
  if (!questoes || questoes.length === 0) {
    return (
      <div className="empty-state">
        <BookOpenCheck size={36} className="empty-state-svg" aria-hidden="true" />
        <strong>Questões ainda não geradas</strong>
        <p className="muted">
          Gere o material com IA e venha resolver questões de múltipla escolha com correção
          automática.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="cta-card">
        <div>
          <strong>{questoes.length} questões prontas</strong>
          <p className="muted">
            Resolva no modo guiado: uma por vez, com feedback imediato e correção automática.
          </p>
        </div>
        <Link to={`/conteudos/${conteudoId}/questoes`} className="primary-button small">
          Resolver questões
        </Link>
      </div>
      <ul className="bullet-list">
        {questoes.slice(0, 5).map((questao, idx) => (
          <li key={questao.id}>
            <strong>Questão {idx + 1}.</strong> {questao.enunciado}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlashcardsView({ flashcards, conteudoId }) {
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="empty-state">
        <Layers size={36} className="empty-state-svg" aria-hidden="true" />
        <strong>Flashcards ainda não gerados</strong>
        <p className="muted">
          A IA cria cartões com pergunta e resposta para você revisar no modo guiado.
        </p>
      </div>
    );
  }

  const revisados = flashcards.filter((c) => c.revisado_em).length;

  return (
    <div className="stack">
      <div className="cta-card">
        <div>
          <strong>{flashcards.length} flashcards</strong>
          <p className="muted">
            {revisados > 0
              ? `${revisados} revisado(s). Continue praticando no modo guiado.`
              : 'Estude no modo guiado: virar carta, marcar revisado e avançar.'}
          </p>
        </div>
        <Link to={`/conteudos/${conteudoId}/flashcards`} className="primary-button small">
          Estudar flashcards
        </Link>
      </div>
      <div className="flashcard-grid">
        {flashcards.slice(0, 4).map((card) => (
          <article
            key={card.id}
            className={`flashcard ${card.revisado_em ? 'reviewed' : ''}`}
          >
            <span className="flashcard-label">Pergunta</span>
            <p>{card.frente}</p>
            <span className="flashcard-hint">
              {card.revisado_em ? 'Revisado' : 'Aguardando revisão'}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

function ConteudoPage() {
  const { conteudoId } = useParams();

  const [conteudo, setConteudo] = useState(null);
  useDocumentTitle(conteudo?.titulo || 'Conteúdo');
  const [resumos, setResumos] = useState([]);
  const [pontosChave, setPontosChave] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [processamentos, setProcessamentos] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [isGerando, setIsGerando] = useState(false);
  const [gerarError, setGerarError] = useState('');
  const [etapasStatus, setEtapasStatus] = useState({});

  const [abaAtiva, setAbaAtiva] = useState('resumo');

  const timersRef = useRef([]);
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

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
    clearTimers();
    setEtapasStatus(Object.fromEntries(STAGES.map((s) => [s, 'processando'])));

    timersRef.current = STAGES.slice(0, -1).map((stage, i) =>
      setTimeout(() => {
        setEtapasStatus((prev) => ({ ...prev, [stage]: 'concluido' }));
      }, (i + 1) * 7000)
    );

    try {
      const resposta = await processamentoService.processarConteudo(conteudoId);
      const reais = {};
      (resposta.tipos_executados || STAGES).forEach((t) => {
        reais[t] = resposta.resultados?.[t]?.status || 'concluido';
      });
      setEtapasStatus(reais);
      await carregarMateriais();
    } catch (error) {
      setGerarError(error.message);
      setEtapasStatus((prev) =>
        Object.fromEntries(STAGES.map((s) => [s, prev[s] === 'processando' ? 'erro' : prev[s]]))
      );
    } finally {
      clearTimers();
      setIsGerando(false);
    }
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

  const temProgresso = isGerando || Object.keys(etapasStatus).length > 0;

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          {conteudo ? (
            <p className="eyebrow">
              <Link to={`/materias/${conteudo.materia_id}`} className="back-link">
                <ArrowLeft size={14} /> Voltar para matéria
              </Link>
            </p>
          ) : (
            <p className="eyebrow">
              <Link to="/dashboard" className="back-link">
                <ArrowLeft size={14} /> Dashboard
              </Link>
            </p>
          )}
          <h1>{conteudo?.titulo || 'Carregando conteúdo...'}</h1>
        </div>
      </section>

      {isLoading ? (
        <section className="content-card">
          <Skeleton width="40%" height="1.4rem" />
          <div style={{ marginTop: 14 }}>
            <SkeletonText lines={4} />
          </div>
        </section>
      ) : errorMessage ? (
        <p className="feedback error">{errorMessage}</p>
      ) : (
        <>
          <section className="content-card">
            <h2>Texto original</h2>
            <p className="conteudo-texto">{conteudo?.texto}</p>
          </section>

          <section className="content-card generator-card">
            <div className="generator-header generator-centered">
              <h2>Gerar material de estudo com IA</h2>
              <p className="muted">
                Dispara resumo, pontos-chave, questões e flashcards em uma única ação.
              </p>
              <button
                type="button"
                className="primary-button button-with-spinner"
                onClick={handleGerarEstudo}
                disabled={isGerando}
              >
                {isGerando ? (
                  <>
                    <Spinner size={16} label="Gerando" />
                    <span>Gerando com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Gerar estudo</span>
                  </>
                )}
              </button>
            </div>

            {gerarError ? <p className="feedback error">{gerarError}</p> : null}

            {temProgresso ? (
              <div className="gen-summary">
                {STAGES.map((tipo) => {
                  const status = etapasStatus[tipo] || 'pendente';
                  return (
                    <div key={tipo} className={`gen-summary-item ${status}`}>
                      <span>{TIPO_LABEL[tipo]}</span>
                      {status === 'processando' ? (
                        <Spinner size={14} label="processando" />
                      ) : (
                        <StatusBadge status={status} />
                      )}
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
              {abaAtiva === 'questoes' && (
                <QuestoesView questoes={questoes} conteudoId={conteudoId} />
              )}
              {abaAtiva === 'flashcards' && (
                <FlashcardsView flashcards={flashcards} conteudoId={conteudoId} />
              )}
            </div>
          </section>

          {processamentos.length > 0 ? (
            <section className="content-card">
              <h2>Histórico de processamento</h2>
              <ul className="history-list">
                {processamentos.slice(0, 10).map((proc) => (
                  <li key={proc.id} className={`history-item ${proc.status}`}>
                    <span className="history-tipo">{TIPO_LABEL[proc.tipo] || proc.tipo}</span>
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
