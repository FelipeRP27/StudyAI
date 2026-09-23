import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw, Target, TrendingDown, TrendingUp, Trophy } from 'lucide-react';

const PRIORIDADE_ROTULO = {
  alta: 'alta',
  media: 'média',
  baixa: 'baixa',
  sem_dados: 'sem dados'
};

const ORDEM_PRIORIDADE = { alta: 0, media: 1, baixa: 2, sem_dados: 3 };

function DiferencaPrioridade({ antes, depois }) {
  if (!antes || !depois) return null;

  const melhorou = ORDEM_PRIORIDADE[depois.prioridade] > ORDEM_PRIORIDADE[antes.prioridade];
  const piorou = ORDEM_PRIORIDADE[depois.prioridade] < ORDEM_PRIORIDADE[antes.prioridade];
  const variacaoTaxa = Math.round(depois.taxa_acerto - antes.taxa_acerto);

  return (
    <div className="resultado-diagnostico">
      <h3>O que mudou no seu diagnóstico</h3>
      <ul className="resultado-diagnostico-lista">
        <li>
          <span>Prioridade</span>
          <strong>
            {PRIORIDADE_ROTULO[antes.prioridade]} → {PRIORIDADE_ROTULO[depois.prioridade]}
            {melhorou ? <TrendingUp size={15} aria-hidden="true" /> : null}
            {piorou ? <TrendingDown size={15} aria-hidden="true" /> : null}
          </strong>
        </li>
        <li>
          <span>Taxa de acerto</span>
          <strong>
            {Math.round(antes.taxa_acerto)}% → {Math.round(depois.taxa_acerto)}%
            {variacaoTaxa !== 0 ? (
              <span className={variacaoTaxa > 0 ? 'variacao-positiva' : 'variacao-negativa'}>
                {variacaoTaxa > 0 ? '+' : '−'}
                {Math.abs(variacaoTaxa)} pontos
              </span>
            ) : null}
          </strong>
        </li>
        {depois.questoes_pendentes !== antes.questoes_pendentes ? (
          <li>
            <span>Erros pendentes</span>
            <strong>
              {antes.questoes_pendentes} → {depois.questoes_pendentes}
            </strong>
          </li>
        ) : null}
      </ul>
      <p className="muted">{depois.justificativa}</p>
    </div>
  );
}

function ResultadoSessao({
  titulo,
  totalAcertos,
  total,
  antes,
  depois,
  proximaAcao,
  proximoTitulo,
  onRefazer
}) {
  return (
    <section className="content-card quiz-summary">
      <Trophy size={56} className="quiz-summary-icon" aria-hidden="true" />
      <h2>{titulo}</h2>
      <p className="quiz-summary-score">
        <strong>{totalAcertos}</strong> de <strong>{total}</strong> corretas (
        {Math.round((totalAcertos / total) * 100)}% de acerto)
      </p>

      <DiferencaPrioridade antes={antes} depois={depois} />

      {proximaAcao ? (
        <div className="resultado-proxima">
          <h3>
            <Target size={16} aria-hidden="true" /> Próximo passo
          </h3>
          <p>{proximoTitulo}</p>
          <Link to={proximaAcao.rota} className="primary-button button-with-spinner">
            <span>{proximaAcao.rotulo}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : null}

      <div className="quiz-summary-actions">
        {onRefazer ? (
          <button type="button" className="secondary-button button-with-spinner" onClick={onRefazer}>
            <RotateCcw size={16} />
            <span>Refazer</span>
          </button>
        ) : null}
        <Link to="/plano" className="secondary-button button-with-spinner">
          <span>Ver meu plano</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

export default ResultadoSessao;
