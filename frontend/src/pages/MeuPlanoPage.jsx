import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleAlert,
  Compass,
  ListChecks,
  Minus,
  NotebookPen,
  Percent,
  Repeat,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy
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

const TENDENCIAS = {
  piora: { rotulo: 'Piorando', classe: 'piora', icone: TrendingDown },
  melhora: { rotulo: 'Melhorando', classe: 'melhora', icone: TrendingUp },
  estavel: { rotulo: 'Estável', classe: 'estavel', icone: Minus }
};

function plural(quantidade, singular, pluralTexto) {
  return quantidade === 1 ? singular : pluralTexto;
}

function formatarDiferenca(diferenca) {
  const pontos = Math.round(Math.abs(diferenca));
  return `${diferenca < 0 ? '−' : '+'}${pontos} ${plural(pontos, 'ponto', 'pontos')}`;
}

function TendenciaBadge({ item }) {
  const config = TENDENCIAS[item.tendencia];
  if (!config) return null;
  const Icone = config.icone;
  return (
    <span className={`tendencia-badge ${config.classe}`}>
      <Icone size={14} aria-hidden="true" />
      {config.rotulo}
      {item.taxa_recente !== null ? (
        <span className="tendencia-detalhe">
          {Math.round(item.taxa_recente)}% nas últimas {item.respostas_recentes}
        </span>
      ) : null}
    </span>
  );
}

function SinaisDiagnostico({ item }) {
  const sinais = [];

  if (item.sessoes_recentes >= 2 && item.sessoes_com_erro >= 2) {
    sinais.push({
      chave: 'sessoes',
      icone: CircleAlert,
      texto: `Erros em ${item.sessoes_com_erro} de ${item.sessoes_recentes} sessões`
    });
  }

  if (item.questoes_erro_recorrente > 0) {
    sinais.push({
      chave: 'recorrentes',
      icone: Repeat,
      texto: `${item.questoes_erro_recorrente} ${plural(item.questoes_erro_recorrente, 'questão errada', 'questões erradas')} mais de uma vez`
    });
  }

  if (sinais.length === 0 && item.assuntos_dificeis.length === 0) return null;

  return (
    <div className="plano-sinais">
      {item.assuntos_dificeis.map((assunto) => (
        <span key={assunto.assunto} className="plano-sinal assunto">
          Dificuldade: <strong>{assunto.assunto}</strong>
          <span className="muted">
            {assunto.erros}/{assunto.respostas} erros
          </span>
        </span>
      ))}
      {sinais.map((sinal) => {
        const Icone = sinal.icone;
        return (
          <span key={sinal.chave} className="plano-sinal">
            <Icone size={13} aria-hidden="true" />
            {sinal.texto}
          </span>
        );
      })}
    </div>
  );
}

function DiagnosticoMaterias({ diagnostico }) {
  const { materias_atencao: atencao, materias_fortes: fortes } = diagnostico;
  if (atencao.length === 0 && fortes.length === 0) return null;

  const renderLista = (materias, vazio) =>
    materias.length === 0 ? (
      <p className="muted">{vazio}</p>
    ) : (
      <ul className="diagnostico-materias-lista">
        {materias.map((materia) => (
          <li key={materia.materia_id}>
            <Link to={`/desempenho/materias/${materia.materia_id}`}>{materia.materia_nome}</Link>
            <span className="diagnostico-materias-numeros">
              <strong>{Math.round(materia.taxa_acerto)}%</strong>
              <span className={materia.diferenca_media < 0 ? 'abaixo' : 'acima'}>
                {formatarDiferenca(materia.diferenca_media)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    );

  return (
    <section className="content-card">
      <header className="section-with-legend">
        <h2>Diagnóstico por matéria</h2>
        <span className="legend muted">comparado à sua média geral</span>
      </header>
      <div className="diagnostico-materias">
        <div className="diagnostico-materias-coluna atencao">
          <h3>
            <CircleAlert size={16} aria-hidden="true" /> Precisam de atenção
          </h3>
          {renderLista(atencao, 'Nenhuma matéria abaixo da sua média.')}
        </div>
        <div className="diagnostico-materias-coluna fortes">
          <h3>
            <Trophy size={16} aria-hidden="true" /> Mais fortes
          </h3>
          {renderLista(fortes, 'Ainda não há matérias acima da sua média.')}
        </div>
      </div>
    </section>
  );
}

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
        <div className="plano-item-taxa-linha">
          <span
            className="plano-item-numeros"
            title={`${item.total_acertos} acertos em ${item.total_respostas} respondidas`}
          >
            {item.taxa_acerto}% de acerto
          </span>
          <TendenciaBadge item={item} />
        </div>
        <BarraTaxa taxa={item.taxa_acerto} />
      </div>

      <SinaisDiagnostico item={item} />

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
        {item.questoes_pendentes > 0 || item.questoes_erro_recorrente > 0 ? (
          <Link
            to={`/erros?conteudo_id=${item.conteudo_id}${item.questoes_pendentes > 0 ? '&status=pendente' : ''}`}
            className="secondary-button small button-with-spinner"
          >
            <NotebookPen size={14} />
            <span>
              {item.questoes_pendentes > 0
                ? `Refazer ${item.questoes_pendentes} ${plural(item.questoes_pendentes, 'erro', 'erros')}`
                : 'Ver erros'}
            </span>
          </Link>
        ) : null}
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
              <MetricCard
                label="Erros pendentes"
                value={resumo.questoes_pendentes ?? 0}
                accent={resumo.questoes_pendentes > 0 ? 'bad' : ''}
                icon={NotebookPen}
              />
            </section>

            <DiagnosticoMaterias diagnostico={plano.diagnostico_materias} />

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
