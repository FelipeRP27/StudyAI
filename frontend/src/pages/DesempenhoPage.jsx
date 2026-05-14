import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { desempenhoService } from '../services/desempenhoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';

function MetricCard({ label, value, accent }) {
  return (
    <article className={`metric-card ${accent || ''}`}>
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

function DesempenhoPage() {
  useDocumentTitle('Desempenho');
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();

  const [dados, setDados] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ativo = true;

    (async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const resposta = await desempenhoService.get({ dias: 30 });
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
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const resumo = dados?.resumo;
  const porMateria = dados?.por_materia || [];
  const evolucao = dados?.evolucao || [];

  const semDados =
    !isLoading && !errorMessage && resumo && resumo.total_respostas === 0;

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            <Link to="/dashboard">← Dashboard</Link>
          </p>
          <h1>Seu desempenho</h1>
          <p className="dashboard-copy">
            Estatísticas dos últimos 30 dias com base nas questões que você respondeu.
          </p>
          <span className="user-chip">{usuario?.nome}</span>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          Sair
        </button>
      </section>

      {isLoading ? <p>Carregando desempenho...</p> : null}
      {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && resumo ? (
        <>
          <section className="metric-grid">
            <MetricCard label="Respostas totais" value={resumo.total_respostas} />
            <MetricCard label="Acertos" value={resumo.total_acertos} accent="good" />
            <MetricCard label="Erros" value={resumo.total_erros} accent="bad" />
            <MetricCard label="Taxa de acerto" value={`${resumo.taxa_acerto}%`} accent="primary" />
          </section>

          {semDados ? (
            <section className="content-card">
              <h2>Comece resolvendo questões</h2>
              <p className="muted">
                Você ainda não respondeu nenhuma questão. Acesse uma matéria, gere o material e
                comece a resolver para ver seu desempenho aqui.
              </p>
              <Link to="/dashboard" className="primary-button small">
                Ir para matérias
              </Link>
            </section>
          ) : (
            <>
              <section className="content-card">
                <h2>Desempenho por matéria</h2>
                {porMateria.length === 0 ? (
                  <p className="muted">Sem dados por matéria ainda.</p>
                ) : (
                  <ul className="materia-stats">
                    {porMateria.map((item) => (
                      <li key={item.materia_id}>
                        <header>
                          <strong>{item.materia_nome}</strong>
                          <span>
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
                <h2>Evolução diária</h2>
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
                        <span className="evolucao-num">
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

export default DesempenhoPage;
