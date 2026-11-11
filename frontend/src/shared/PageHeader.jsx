import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function PageHeader({ voltarPara, voltarRotulo, eyebrow, titulo, descricao, acoes, children }) {
  const topo = voltarPara ? (
    <Link to={voltarPara} className="back-link">
      <ArrowLeft size={14} /> {voltarRotulo || 'Voltar'}
    </Link>
  ) : (
    eyebrow
  );

  return (
    <section className="dashboard-hero page-header">
      <div className="dashboard-hero-content">
        {topo ? <p className="eyebrow">{topo}</p> : null}
        <h1>{titulo}</h1>
        {descricao ? <p className="dashboard-copy">{descricao}</p> : null}
        {children}
      </div>
      {acoes ? <div className="hero-actions">{acoes}</div> : null}
    </section>
  );
}

export default PageHeader;
