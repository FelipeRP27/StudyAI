import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

function Trilha({ trilha }) {
  return (
    <ol className="trilha" aria-label="Primeiros passos">
      {trilha.map((item, indice) => (
        <li
          key={item.etapa}
          className={`trilha-item ${item.concluida ? 'concluida' : ''} ${item.atual ? 'atual' : ''}`}
        >
          <span className="trilha-marcador" aria-hidden="true">
            {item.concluida ? <Check size={13} strokeWidth={3} /> : indice + 1}
          </span>
          <span className="trilha-rotulo">{item.rotulo}</span>
        </li>
      ))}
    </ol>
  );
}

function ProximoPasso({ passo, comTrilha = false }) {
  if (!passo || passo.concluida) return null;

  return (
    <section className="content-card proximo-passo">
      {comTrilha && passo.trilha ? <Trilha trilha={passo.trilha} /> : null}

      <div className="proximo-passo-corpo">
        <div className="proximo-passo-texto">
          <p className="eyebrow">Próximo passo</p>
          <h2>{passo.titulo}</h2>
          <p className="muted">{passo.descricao}</p>
        </div>
        <Link to={passo.acao.rota} className="primary-button">
          <span>{passo.acao.rotulo}</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

export default ProximoPasso;
