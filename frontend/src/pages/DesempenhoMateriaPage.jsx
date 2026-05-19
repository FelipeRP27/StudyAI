import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, CheckCircle2, FileText, Percent, XCircle } from 'lucide-react';
import { desempenhoService } from '../services/desempenhoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import Skeleton from '../shared/Skeleton';

function MetricCard({ label, value, accent, icon: Icon }) {
  return (
    <article className={`metric-card ${accent || ''}`}>
      {Icon ? <Icon size={20} className="metric-icon" aria-hidden="true" /> : null}
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
    </article>
  );
}

function BarraTaxa({ taxa }) {
  const pct = Math.max(0, Math.min(100, Number(taxa) || 0));
  let classe = 'progress-fill';
  if (pct >= 70) classe += ' good';
  else if (pct >= 40) classe += ' warn';
  else classe += ' bad';

  return (
    <div className="progress-track">
      <div className={classe} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DesempenhoMateriaPage() {
  const { materiaId } = useParams();
  const [dados, setDados] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useDocumentTitle(dados?.materia?.nome ? `Desempenho — ${dados.materia.nome}` : 'Desempenho');

  useEffect(() => {
    let ativo = true;

    (async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const resposta = await desempenhoService.getByMateria(materiaId, { dias: 30 });
        if (ativo) setDados(resposta);
      } catch (error) {
        if (ativo) setErrorMessage(error.message);
      } finally {
        if (ativo) setIsLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [materiaId]);

  const resumo = dados?.resumo;
  const porConteudo = dados?.por_conteudo || [];
  const evolucao = dados?.evolucao || [];
  const materia = dados?.materia;

  const semDados = !isLoading && !errorMessage && resumo && resumo.total_respostas === 0;

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            <Link to="/desempenho" className="back-link">
              <ArrowLeft size={14} /> Desempenho
            </Link>
          </p>
          <h1>{materia?.nome || 'Carregando matéria...'}</h1>
          <p className="dashboard-copy">
            Como você está indo nesta matéria nos últimos 30 dias.
          </p>
        </div>
      </section>

      {isLoading ? (
        <>
          <section className="metric-grid" style={{ marginBottom: 20 }}>
            <Skeleton height="92px" radius={18} />
            <Skeleton height="92px" radius={18} />
            <Skeleton height="92px" radius={18} />
            <Skeleton height="92px" radius={18} />
          </section>
          <section className="content-card">
            <Skeleton width="40%" height="1.1rem" />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Skeleton height="36px" />
              <Skeleton height="36px" />
              <Skeleton height="36px" />
            </div>
          </section>
        </>
      ) : null}

      {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && resumo ? (
        <>
          <section className="metric-grid">
            <MetricCard
              label="Respostas totais"
              value={resumo.total_respostas}
              icon={BarChart3}
            />
            <MetricCard
              label="Acertos"
              value={resumo.total_acertos}
              accent="good"
              icon={CheckCircle2}
            />
            <MetricCard
              label="Erros"
              value={resumo.total_erros}
              accent="bad"
              icon={XCircle}
            />
            <MetricCard
              label="Taxa de acerto"
              value={`${resumo.taxa_acerto}%`}
              accent="primary"
              icon={Percent}
            />
          </section>

          {semDados ? (
            <section className="content-card">
              <div className="empty-state">
                <BarChart3 size={40} className="empty-state-svg" aria-hidden="true" />
                <strong>Sem respostas nesta matéria ainda</strong>
                <p className="muted">
                  Acesse um conteúdo desta matéria, gere o material com IA e responda algumas
                  questões para começar a ver suas métricas aqui.
                </p>
                <Link
                  to={`/materias/${materiaId}`}
                  className="primary-button small button-with-spinner"
                >
                  <ArrowLeft size={14} />
                  <span>Ir para a matéria</span>
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="content-card">
                <header className="section-with-legend">
                  <h2>Desempenho por conteúdo</h2>
                  <span className="legend muted">acertos / total respondidas</span>
                </header>
                {porConteudo.length === 0 ? (
                  <p className="muted">Nenhum conteúdo com respostas registradas.</p>
                ) : (
                  <ul className="materia-stats">
                    {porConteudo.map((item) => (
                      <li key={item.conteudo_id}>
                        <header>
                          <Link to={`/conteudos/${item.conteudo_id}`} className="back-link">
                            <FileText size={14} /> {item.conteudo_titulo}
                          </Link>
                          <span
                            title={`${item.total_acertos} acertos em ${item.total_respostas} respondidas`}
                          >
                            {item.total_acertos}/{item.total_respostas} ({item.taxa_acerto}%)
                          </span>
                        </header>
                        <BarraTaxa taxa={item.taxa_acerto} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="content-card">
                <header className="section-with-legend">
                  <h2>Evolução diária</h2>
                  <span className="legend muted">acertos / total respondidas</span>
                </header>
                {evolucao.length === 0 ? (
                  <p className="muted">Sem registros nos últimos 30 dias.</p>
                ) : (
                  <ul className="evolucao-list">
                    {evolucao.map((dia) => (
                      <li key={dia.dia}>
                        <span className="evolucao-data">
                          {new Date(dia.dia).toLocaleDateString('pt-BR')}
                        </span>
                        <BarraTaxa taxa={dia.taxa_acerto} />
                        <span
                          className="evolucao-num"
                          title={`${dia.total_acertos} acertos em ${dia.total_respostas} respondidas`}
                        >
                          {dia.total_acertos}/{dia.total_respostas}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </>
      ) : null}
    </main>
  );
}

export default DesempenhoMateriaPage;
