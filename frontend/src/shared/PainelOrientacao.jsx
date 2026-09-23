import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CircleAlert,
  Compass,
  History,
  NotebookPen,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy
} from 'lucide-react';
import Skeleton from './Skeleton';

const PRIORIDADE_ROTULO = {
  alta: 'Prioridade alta',
  media: 'Prioridade média',
  baixa: 'Prioridade baixa'
};

function plural(quantidade, singular, pluralTexto) {
  return quantidade === 1 ? singular : pluralTexto;
}

function Evolucao({ evolucao }) {
  if (!evolucao || evolucao.taxa_recente === null) {
    return <span className="muted">Sem respostas nos últimos {evolucao?.dias_recentes || 7} dias</span>;
  }

  const variacao = evolucao.variacao;
  const Icone = variacao > 0 ? TrendingUp : variacao < 0 ? TrendingDown : null;

  return (
    <span className={`painel-evolucao ${variacao > 0 ? 'melhora' : variacao < 0 ? 'piora' : ''}`}>
      {Icone ? <Icone size={14} aria-hidden="true" /> : null}
      {Math.round(evolucao.taxa_recente)}% nos últimos {evolucao.dias_recentes} dias
      {variacao !== null && variacao !== 0 ? (
        <small>
          {variacao > 0 ? '+' : '−'}
          {Math.abs(Math.round(variacao))} pontos
        </small>
      ) : null}
    </span>
  );
}

function ListaMaterias({ materias, vazio }) {
  if (materias.length === 0) return <p className="muted">{vazio}</p>;

  return (
    <ul className="painel-materias">
      {materias.map((materia) => (
        <li key={materia.materia_id}>
          <Link to={`/desempenho/materias/${materia.materia_id}`}>{materia.materia_nome}</Link>
          <strong>{Math.round(materia.taxa_acerto)}%</strong>
        </li>
      ))}
    </ul>
  );
}

function PainelOrientacao({ painel, isLoading }) {
  if (isLoading) {
    return (
      <section className="painel-grid" aria-busy="true" aria-label="Carregando orientação">
        <Skeleton height="190px" radius={18} />
        <Skeleton height="190px" radius={18} />
        <Skeleton height="190px" radius={18} />
      </section>
    );
  }

  if (!painel) return null;

  const { como_voce_esta: comoEsta, onde_focar: ondeFocar, o_que_fazer_agora: proximasAcoes } = painel;
  const semDados = painel.status !== 'ok';

  return (
    <section className="painel-grid">
      <article className="content-card painel-card">
        <h2 className="card-heading">
          <span className="card-heading-icon" aria-hidden="true">
            <Percent size={18} />
          </span>
          Como você está
        </h2>
        <p className="painel-destaque">
          {comoEsta.total_respostas > 0 ? `${Math.round(comoEsta.taxa_acerto)}%` : '—'}
          <small>de acerto em {comoEsta.total_respostas} respostas</small>
        </p>
        <Evolucao evolucao={comoEsta.evolucao} />
        <div className="painel-materias-blocos">
          <div>
            <h3>
              <Trophy size={14} aria-hidden="true" /> Mais fortes
            </h3>
            <ListaMaterias materias={comoEsta.materias_fortes} vazio="Ainda sem dados." />
          </div>
          <div>
            <h3>
              <CircleAlert size={14} aria-hidden="true" /> Precisam de atenção
            </h3>
            <ListaMaterias materias={comoEsta.materias_atencao} vazio="Nenhuma abaixo da média." />
          </div>
        </div>
      </article>

      <article className="content-card painel-card">
        <h2 className="card-heading">
          <span className="card-heading-icon" aria-hidden="true">
            <Compass size={18} />
          </span>
          Onde focar
        </h2>

        {semDados ? (
          <p className="muted">{painel.mensagem}</p>
        ) : (
          <>
            <ul className="painel-prioritarios">
              {ondeFocar.conteudos_prioritarios.length === 0 ? (
                <li className="muted">Nenhum conteúdo em prioridade alta ou média.</li>
              ) : (
                ondeFocar.conteudos_prioritarios.map((conteudo) => (
                  <li key={conteudo.conteudo_id}>
                    <Link to={`/conteudos/${conteudo.conteudo_id}`}>{conteudo.conteudo_titulo}</Link>
                    <span className={`plano-badge ${conteudo.prioridade}`}>
                      {PRIORIDADE_ROTULO[conteudo.prioridade]}
                    </span>
                  </li>
                ))
              )}
            </ul>

            <div className="painel-focos">
              <Link to="/erros?status=pendente" className="painel-foco">
                <NotebookPen size={15} aria-hidden="true" />
                <span>
                  <strong>{ondeFocar.erros.pendentes}</strong>{' '}
                  {plural(ondeFocar.erros.pendentes, 'erro pendente', 'erros pendentes')}
                </span>
              </Link>
              {ondeFocar.revisoes_recomendadas.length > 0 ? (
                <Link
                  to={`/conteudos/${ondeFocar.revisoes_recomendadas[0].conteudo_id}?aba=resumo`}
                  className="painel-foco"
                >
                  <History size={15} aria-hidden="true" />
                  <span>
                    Revisar <strong>{ondeFocar.revisoes_recomendadas[0].conteudo_titulo}</strong>, há{' '}
                    {ondeFocar.revisoes_recomendadas[0].dias_sem_estudar} dias sem estudo
                  </span>
                </Link>
              ) : null}
              {ondeFocar.erros.assuntos.length > 0 ? (
                <span className="painel-foco estatico">
                  <CircleAlert size={15} aria-hidden="true" />
                  <span>
                    Mais erros em <strong>{ondeFocar.erros.assuntos[0].assunto || 'sem assunto'}</strong>
                  </span>
                </span>
              ) : null}
            </div>
          </>
        )}
      </article>

      <article className="content-card painel-card painel-acoes">
        <h2 className="card-heading">
          <span className="card-heading-icon" aria-hidden="true">
            <Target size={18} />
          </span>
          O que fazer agora
        </h2>
        <ol className="painel-lista-acoes">
          {proximasAcoes.map((acao, indice) => (
            <li key={acao.rota}>
              <span className="painel-acao-ordem">{indice + 1}</span>
              <div className="painel-acao-conteudo">
                {acao.conteudo_titulo ? <strong>{acao.conteudo_titulo}</strong> : null}
                <Link
                  to={acao.rota}
                  className={`${indice === 0 ? 'primary-button' : 'secondary-button'} small button-with-spinner`}
                >
                  <span>{acao.rotulo}</span>
                  <ArrowRight size={14} />
                </Link>
                {acao.motivo ? <p className="muted">{acao.motivo}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}

export default PainelOrientacao;
