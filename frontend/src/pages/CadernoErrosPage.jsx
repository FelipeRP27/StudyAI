import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CircleAlert,
  CircleCheck,
  Layers,
  NotebookPen,
  RotateCcw,
  Tag,
  Trophy
} from 'lucide-react';
import Skeleton from '../shared/Skeleton';
import QuestaoQuiz, { AssuntoTag } from '../shared/QuestaoQuiz';
import { cadernoErrosService } from '../services/cadernoErrosService';
import { useDocumentTitle } from '../shared/useDocumentTitle';

const STATUS_ABAS = [
  { valor: '', rotulo: 'Todas', contagem: 'questoes' },
  { valor: 'pendente', rotulo: 'Pendentes', contagem: 'pendentes' },
  { valor: 'revisado', rotulo: 'Revisadas', contagem: 'revisadas' }
];

const MAXIMO_ASSUNTOS_EXIBIDOS = 5;

function plural(quantidade, singular, pluralTexto) {
  return quantidade === 1 ? singular : pluralTexto;
}

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleDateString('pt-BR') : '';
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

function StatusBadge({ status }) {
  return status === 'pendente' ? (
    <span className="erro-status pendente">
      <CircleAlert size={13} aria-hidden="true" /> Pendente
    </span>
  ) : (
    <span className="erro-status revisado">
      <CircleCheck size={13} aria-hidden="true" /> Revisada
    </span>
  );
}

function OndeMaisErra({ resumo }) {
  const assuntos = resumo.por_assunto.slice(0, MAXIMO_ASSUNTOS_EXIBIDOS);
  const maiorErro = Math.max(1, ...assuntos.map((grupo) => grupo.total_erros));

  return (
    <section className="content-card">
      <header className="section-with-legend">
        <h2>Onde você mais erra</h2>
        <span className="legend muted">total de erros registrados</span>
      </header>
      <div className="erros-concentracao">
        <div>
          <h3 className="erros-concentracao-titulo">
            <Tag size={15} aria-hidden="true" /> Assuntos
          </h3>
          <ul className="erros-ranking">
            {assuntos.map((grupo) => (
              <li key={`${grupo.materia_id}-${grupo.assunto ?? 'sem-assunto'}`}>
                <div className="erros-ranking-linha">
                  <span className="erros-ranking-nome">
                    {grupo.assunto || 'Sem assunto classificado'}
                    <small>{grupo.materia_nome}</small>
                  </span>
                  <span className="erros-ranking-valor">
                    {grupo.total_erros} {plural(grupo.total_erros, 'erro', 'erros')}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill bad"
                    style={{ width: `${(grupo.total_erros / maiorErro) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="erros-concentracao-titulo">
            <Layers size={15} aria-hidden="true" /> Matérias
          </h3>
          <ul className="erros-materias">
            {resumo.por_materia.map((grupo) => (
              <li key={grupo.materia_id}>
                <span>{grupo.materia_nome}</span>
                <span className="erros-materias-numeros">
                  {grupo.total_erros} {plural(grupo.total_erros, 'erro', 'erros')}
                  {grupo.pendentes > 0 ? (
                    <strong>
                      {grupo.pendentes} {plural(grupo.pendentes, 'pendente', 'pendentes')}
                    </strong>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ErroItem({ item, onRefazer }) {
  return (
    <li className={`erro-item ${item.status}`}>
      <div className="erro-item-topo">
        <StatusBadge status={item.status} />
        <AssuntoTag assunto={item.questao.assunto} />
      </div>
      <p className="erro-item-enunciado">{item.questao.enunciado}</p>
      <div className="erro-item-rodape">
        <span className="muted">
          Errou {item.total_erros} {plural(item.total_erros, 'vez', 'vezes')} em{' '}
          {item.total_respostas} {plural(item.total_respostas, 'tentativa', 'tentativas')} · último
          erro em {formatarData(item.ultimo_erro_em)}
        </span>
        <button
          type="button"
          className="secondary-button small button-with-spinner"
          onClick={() => onRefazer([item])}
        >
          <RotateCcw size={14} />
          <span>Refazer</span>
        </button>
      </div>
    </li>
  );
}

function CadernoErrosPage() {
  useDocumentTitle('Caderno de erros');
  const [searchParams, setSearchParams] = useSearchParams();

  const materiaId = searchParams.get('materia_id') || '';
  const conteudoId = searchParams.get('conteudo_id') || '';
  const status = searchParams.get('status') || '';

  const [resumo, setResumo] = useState(null);
  const [lista, setLista] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessao, setSessao] = useState(null);
  const [isPreparandoSessao, setIsPreparandoSessao] = useState(false);

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [resumoData, listaData] = await Promise.all([
        cadernoErrosService.resumo(),
        cadernoErrosService.listar({ materia_id: materiaId, conteudo_id: conteudoId, status })
      ]);
      setResumo(resumoData);
      setLista(listaData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [materiaId, conteudoId, status]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const atualizarFiltro = (chave, valor) => {
    const proximos = new URLSearchParams(searchParams);
    if (valor) proximos.set(chave, valor);
    else proximos.delete(chave);
    if (chave === 'materia_id') proximos.delete('conteudo_id');
    setSearchParams(proximos);
  };

  const conteudosDoFiltro = useMemo(() => {
    if (!resumo) return [];
    return resumo.por_conteudo.filter(
      (grupo) => !materiaId || String(grupo.materia_id) === materiaId
    );
  }, [resumo, materiaId]);

  const gruposPorConteudo = useMemo(() => {
    const grupos = new Map();
    (lista?.itens || []).forEach((item) => {
      if (!grupos.has(item.conteudo_id)) {
        grupos.set(item.conteudo_id, {
          conteudo_id: item.conteudo_id,
          conteudo_titulo: item.conteudo_titulo,
          materia_nome: item.materia_nome,
          itens: []
        });
      }
      grupos.get(item.conteudo_id).itens.push(item);
    });
    return [...grupos.values()];
  }, [lista]);

  const iniciarSessao = (itens, titulo) => {
    setSessao({ titulo, questoes: itens.map((item) => ({ ...item.questao, contexto: item })) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refazerPendentes = async () => {
    setIsPreparandoSessao(true);
    setErrorMessage('');
    try {
      const pendentes = await cadernoErrosService.listar({
        materia_id: materiaId,
        conteudo_id: conteudoId,
        status: 'pendente'
      });
      iniciarSessao(pendentes.itens, 'Refazendo erros pendentes');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsPreparandoSessao(false);
    }
  };

  const encerrarSessao = () => {
    setSessao(null);
    carregar();
  };

  const pendentesNoFiltro = lista?.resumo.pendentes || 0;
  const cadernoVazio = resumo && resumo.questoes === 0;
  const temFiltro = Boolean(materiaId || conteudoId);

  if (sessao) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <p className="eyebrow">
              <button type="button" className="back-link link-button" onClick={encerrarSessao}>
                <ArrowLeft size={14} /> Voltar ao caderno de erros
              </button>
            </p>
            <h1>{sessao.titulo}</h1>
            <p className="dashboard-copy">
              Acertar agora tira a questão dos pendentes. Leia a justificativa de cada alternativa.
            </p>
          </div>
        </section>

        <QuestaoQuiz
          questoes={sessao.questoes}
          renderContexto={(questao) => (
            <div className="quiz-contexto">
              <span className="quiz-contexto-conteudo">
                {questao.contexto.materia_nome} · {questao.contexto.conteudo_titulo}
              </span>
              <AssuntoTag assunto={questao.assunto} />
              <span className="muted">
                Errou {questao.contexto.total_erros}{' '}
                {plural(questao.contexto.total_erros, 'vez', 'vezes')}
              </span>
            </div>
          )}
          renderResultado={({ totalAcertos, total, refazer }) => (
            <section className="content-card quiz-summary">
              <Trophy size={56} className="quiz-summary-icon" aria-hidden="true" />
              <h2>Revisão concluída</h2>
              <p className="quiz-summary-score">
                <strong>{totalAcertos}</strong> de <strong>{total}</strong>{' '}
                {plural(total, 'erro refeito corretamente', 'erros refeitos corretamente')}
              </p>
              <p className="muted">
                {totalAcertos === total
                  ? 'Todas as questões saíram dos pendentes.'
                  : `${total - totalAcertos} ${plural(total - totalAcertos, 'questão continua pendente', 'questões continuam pendentes')} no caderno.`}
              </p>
              <div className="quiz-summary-actions">
                <button type="button" className="secondary-button button-with-spinner" onClick={refazer}>
                  <RotateCcw size={16} />
                  <span>Refazer de novo</span>
                </button>
                <button type="button" className="primary-button button-with-spinner" onClick={encerrarSessao}>
                  <NotebookPen size={16} />
                  <span>Voltar ao caderno</span>
                </button>
              </div>
            </section>
          )}
        />
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            <Link to="/plano" className="back-link">
              <ArrowLeft size={14} /> Meu plano
            </Link>
          </p>
          <h1>Caderno de erros</h1>
          <p className="dashboard-copy">
            Toda questão que você erra entra aqui. Ela fica pendente até você acertá-la de novo.
          </p>
        </div>
      </section>

      {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

      {isLoading && !resumo ? (
        <>
          <section className="metric-grid" aria-busy="true" aria-label="Carregando caderno de erros">
            <Skeleton height="92px" radius={18} />
            <Skeleton height="92px" radius={18} />
            <Skeleton height="92px" radius={18} />
            <Skeleton height="92px" radius={18} />
          </section>
          <section className="content-card">
            <Skeleton width="40%" height="1.1rem" />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton height="96px" radius={16} />
              <Skeleton height="96px" radius={16} />
            </div>
          </section>
        </>
      ) : null}

      {resumo && cadernoVazio ? (
        <section className="content-card">
          <div className="empty-state">
            <NotebookPen size={40} className="empty-state-svg" aria-hidden="true" />
            <strong>Nenhum erro registrado ainda</strong>
            <p className="muted">
              Quando você errar uma questão, ela aparece aqui para ser refeita.
            </p>
            <Link to="/dashboard" className="primary-button small button-with-spinner">
              <BookOpen size={14} />
              <span>Escolher um conteúdo</span>
            </Link>
          </div>
        </section>
      ) : null}

      {resumo && !cadernoVazio ? (
        <>
          <section className="metric-grid">
            <MetricCard label="Questões no caderno" value={resumo.questoes} icon={NotebookPen} accent="primary" />
            <MetricCard label="Pendentes" value={resumo.pendentes} icon={CircleAlert} accent="bad" />
            <MetricCard label="Revisadas" value={resumo.revisadas} icon={CircleCheck} accent="good" />
            <MetricCard label="Erros registrados" value={resumo.total_erros} icon={Layers} />
          </section>

          <OndeMaisErra resumo={resumo} />

          <section className="content-card">
            <header className="section-with-legend">
              <h2>Questões erradas</h2>
              <button
                type="button"
                className="primary-button small button-with-spinner"
                onClick={refazerPendentes}
                disabled={pendentesNoFiltro === 0 || isPreparandoSessao}
              >
                <RotateCcw size={14} />
                <span>
                  {pendentesNoFiltro === 0
                    ? 'Nenhum erro pendente'
                    : `Refazer ${pendentesNoFiltro} ${plural(pendentesNoFiltro, 'erro pendente', 'erros pendentes')}`}
                </span>
              </button>
            </header>

            <div className="erros-filtros">
              <label className="field" htmlFor="filtro-materia">
                <span>Matéria</span>
                <select
                  id="filtro-materia"
                  value={materiaId}
                  onChange={(event) => atualizarFiltro('materia_id', event.target.value)}
                >
                  <option value="">Todas as matérias</option>
                  {resumo.por_materia.map((grupo) => (
                    <option key={grupo.materia_id} value={grupo.materia_id}>
                      {grupo.materia_nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" htmlFor="filtro-conteudo">
                <span>Conteúdo</span>
                <select
                  id="filtro-conteudo"
                  value={conteudoId}
                  onChange={(event) => atualizarFiltro('conteudo_id', event.target.value)}
                >
                  <option value="">Todos os conteúdos</option>
                  {conteudosDoFiltro.map((grupo) => (
                    <option key={grupo.conteudo_id} value={grupo.conteudo_id}>
                      {grupo.conteudo_titulo}
                    </option>
                  ))}
                </select>
              </label>
              <div className="erros-abas" role="group" aria-label="Filtrar por status">
                {STATUS_ABAS.map((aba) => (
                  <button
                    key={aba.valor || 'todas'}
                    type="button"
                    className={`erros-aba ${status === aba.valor ? 'ativa' : ''}`}
                    aria-pressed={status === aba.valor}
                    onClick={() => atualizarFiltro('status', aba.valor)}
                  >
                    {aba.rotulo}
                    <span className="erros-aba-contagem">{lista?.resumo[aba.contagem] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="erros-grupos" aria-busy="true">
                <Skeleton height="96px" radius={16} />
                <Skeleton height="96px" radius={16} />
              </div>
            ) : gruposPorConteudo.length === 0 ? (
              <div className="empty-state">
                <CircleCheck size={36} className="empty-state-svg" aria-hidden="true" />
                <strong>
                  {status === 'pendente' ? 'Nenhum erro pendente aqui' : 'Nenhuma questão encontrada'}
                </strong>
                <p className="muted">
                  {temFiltro || status
                    ? 'Ajuste os filtros para ver outras questões do caderno.'
                    : 'Seu caderno está em dia.'}
                </p>
              </div>
            ) : (
              <div className="erros-grupos">
                {gruposPorConteudo.map((grupo) => (
                  <article key={grupo.conteudo_id} className="erros-grupo">
                    <header className="erros-grupo-header">
                      <div>
                        <strong>{grupo.conteudo_titulo}</strong>
                        <span className="muted">{grupo.materia_nome}</span>
                      </div>
                      <Link
                        to={`/conteudos/${grupo.conteudo_id}`}
                        className="secondary-button small button-with-spinner"
                      >
                        <BookOpen size={14} />
                        <span>Revisar conteúdo</span>
                      </Link>
                    </header>
                    <ul className="erros-lista">
                      {grupo.itens.map((item) => (
                        <ErroItem
                          key={item.questao.id}
                          item={item}
                          onRefazer={(itens) => iniciarSessao(itens, 'Refazendo questão')}
                        />
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

export default CadernoErrosPage;
