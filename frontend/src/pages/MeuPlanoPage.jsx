import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  ListChecks,
  Percent,
  Target
} from 'lucide-react';
import Skeleton from '../shared/Skeleton';
import { planoEstudoService } from '../services/planoEstudoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';

const PRIORIDADES = {
  alta: { rotulo: 'Prioridade alta', classe: 'alta' },
  media: { rotulo: 'Prioridade média', classe: 'media' },
  baixa: { rotulo: 'Prioridade baixa', classe: 'baixa' },
  sem_dados: { rotulo: 'Sem dados suficientes', classe: 'sem-dados' }
};

function PrioridadeBadge({ prioridade }) {
  const config = PRIORIDADES[prioridade] || PRIORIDADES.sem_dados;
  return <span className={`plano-badge ${config.classe}`}>{config.rotulo}</span>;
}

function BarraTaxa({ taxa }) {
  const pct = Math.max(0, Math.min(100, Number(taxa) || 0));
  let classe = 'progress-fill';
  if (pct >= 80) classe += ' good';
  else if (pct >= 60) classe += ' warn';
  else classe += ' bad';

  return (
    <div className="progress-track">
      <div className={classe} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MetricCard({ label, value, accent, icon: Icon }) {
  return (
    <article className={`metric-card ${accent || ''}`}>
      {Icon ? <Icon size={20} className="metric-icon" aria-hidden="true" /> : null}
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
    </article>
  );
}

function PlanoItem({ item, ordem }) {
  return (
    <li className={`plano-item ${PRIORIDADES[item.prioridade]?.classe || ''}`}>
      <header className="plano-item-header">
        <div>
          <span className="plano-item-ordem">{ordem}</span>
          <strong className="plano-item-titulo">{item.conteudo_titulo}</strong>
          <span className="plano-item-materia">{item.materia_nome}</span>
        </div>
        <PrioridadeBadge prioridade={item.prioridade} />
      </header>

      <div className="plano-item-taxa">
        <span
          className="plano-item-numeros"
          title={`${item.total_acertos} acertos em ${item.total_respostas} respondidas`}
        >
          {item.taxa_acerto}% de acerto
        </span>
        <BarraTaxa taxa={item.taxa_acerto} />
      </div>

      <p className="plano-item-justificativa">{item.justificativa}</p>
      <p className="plano-item-recomendacao">
        <Target size={15} aria-hidden="true" />
        <span>{item.recomendacao}</span>
      </p>

      <footer className="plano-item-acoes">
        <Link to={`/conteudos/${item.conteudo_id}`} className="secondary-button small">
          <BookOpen size={14} />
          <span>Revisar conteúdo</span>
        </Link>
        <Link
          to={`/conteudos/${item.conteudo_id}/questoes`}
          className="primary-button small button-with-spinner"
        >
          <span>Responder questões</span>
          <ArrowRight size={14} />
        </Link>
      </footer>
    </li>
  );
}

function MeuPlanoPage() {
  useDocumentTitle('Meu plano');

  const [plano, setPlano] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ativo = true;

    (async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const resposta = await planoEstudoService.get();
        if (ativo) setPlano(resposta);
      } catch (error) {
        if (ativo) setErrorMessage(error.message);
      } finally {
        if (ativo) setIsLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  const resumo = plano?.resumo;
  const itens = plano?.itens || [];
  const dadosInsuficientes = plano?.status === 'dados_insuficientes';

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            <Link to="/dashboard" className="back-link">
              <ArrowLeft size={14} /> Dashboard
            </Link>
          </p>
          <h1>Meu plano de estudo</h1>
          <p className="dashboard-copy">
            O StudyAI analisa suas respostas e indica o que estudar primeiro, com o motivo de cada
            recomendação.
          </p>
        </div>
      </section>

      {isLoading ? (
        <>
          <section
            className="metric-grid"
            style={{ marginBottom: 20 }}
            aria-busy="true"
            aria-label="Carregando plano de estudo"
          >
            <Skeleton height="92px" radius={18} />
            <Skeleton height="92px" radius={18} />
            <Skeleton height="92px" radius={18} />
          </section>
          <section className="content-card">
            <Skeleton width="40%" height="1.1rem" />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Skeleton height="120px" radius={16} />
              <Skeleton height="120px" radius={16} />
            </div>
          </section>
        </>
      ) : null}

      {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && plano ? (
        dadosInsuficientes ? (
          <section className="content-card">
            <div className="empty-state">
              <Compass size={40} className="empty-state-svg" aria-hidden="true" />
              <strong>Ainda precisamos conhecer melhor seu desempenho</strong>
              <p className="muted">{plano.mensagem}</p>
              <Link to="/dashboard" className="primary-button small button-with-spinner">
                <span>{plano.acao_inicial || 'Responder questões'}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="metric-grid">
              <MetricCard
                label="Taxa de acerto geral"
                value={`${resumo.taxa_acerto}%`}
                accent="primary"
                icon={Percent}
              />
              <MetricCard
                label="Questões respondidas"
                value={resumo.total_respostas}
                icon={ListChecks}
              />
              <MetricCard
                label="Conteúdos analisados"
                value={resumo.conteudos_analisados}
                accent="good"
                icon={Compass}
              />
            </section>

            <section className="content-card">
              <header className="section-with-legend">
                <h2>Onde focar agora</h2>
                <span className="legend muted">ordenado por prioridade</span>
              </header>
              <ul className="plano-list">
                {itens.map((item, indice) => (
                  <PlanoItem key={item.conteudo_id} item={item} ordem={indice + 1} />
                ))}
              </ul>
            </section>
          </>
        )
      ) : null}
    </main>
  );
}

export default MeuPlanoPage;
