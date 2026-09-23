import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpenCheck, Sparkles } from 'lucide-react';
import Skeleton, { SkeletonText } from '../shared/Skeleton';
import Spinner from '../shared/Spinner';
import QuestaoQuiz, { AssuntoTag } from '../shared/QuestaoQuiz';
import ResultadoSessao from '../shared/ResultadoSessao';
import { planoEstudoService } from '../services/planoEstudoService';
import { processamentoService } from '../services/processamentoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import { useRegistroDeEstudo } from '../shared/useRegistroDeEstudo';

const STATUS_ROTULO = {
  erro_pendente: 'Erro pendente',
  ja_errada: 'Você já errou esta questão',
  ja_respondida: 'Revisão',
  nao_respondida: 'Questão nova'
};

function SessaoEstudoPage() {
  useDocumentTitle('Sessão de questões');
  const [searchParams] = useSearchParams();
  const conteudoId = searchParams.get('conteudo_id');
  const quantidade = searchParams.get('quantidade') || '';

  const [sessao, setSessao] = useState(null);
  const [planoAntes, setPlanoAntes] = useState(null);
  const [planoDepois, setPlanoDepois] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGerando, setIsGerando] = useState(false);

  useRegistroDeEstudo(conteudoId, 'questoes');

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setPlanoDepois(null);
    try {
      const [sessaoData, planoData] = await Promise.all([
        planoEstudoService.sessao({ conteudo_id: conteudoId, quantidade }),
        planoEstudoService.get().catch(() => null)
      ]);
      setSessao(sessaoData);
      setPlanoAntes(planoData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [conteudoId, quantidade]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const gerarMaisQuestoes = async () => {
    setIsGerando(true);
    setErrorMessage('');
    try {
      await processamentoService.processarConteudo(conteudoId, ['questoes']);
      await carregar();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsGerando(false);
    }
  };

  const itemDoPlano = (plano) =>
    plano?.itens?.find((item) => String(item.conteudo_id) === String(conteudoId)) || null;

  const proximoItemDoPlano = (plano) =>
    plano?.itens?.find((item) => String(item.conteudo_id) !== String(conteudoId)) || null;

  const aoConcluir = async () => {
    const plano = await planoEstudoService.get().catch(() => null);
    setPlanoDepois(plano);
  };

  const proximoItem = proximoItemDoPlano(planoDepois || planoAntes);

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            <Link to="/plano" className="back-link">
              <ArrowLeft size={14} /> Meu plano
            </Link>
          </p>
          <h1>Sessão de questões</h1>
          <p className="dashboard-copy">
            {sessao
              ? `${sessao.conteudo.materia_nome ? `${sessao.conteudo.materia_nome} · ` : ''}${sessao.conteudo.titulo}`
              : 'Carregando...'}
          </p>
        </div>
      </section>

      {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

      {isLoading ? (
        <section className="content-card">
          <Skeleton width="35%" height="1.1rem" />
          <div style={{ marginTop: 18 }}>
            <SkeletonText lines={2} />
          </div>
        </section>
      ) : !sessao ? null : sessao.questoes.length === 0 ? (
        <section className="content-card">
          <div className="empty-state">
            <BookOpenCheck size={36} className="empty-state-svg" aria-hidden="true" />
            <strong>Este conteúdo ainda não tem questões</strong>
            <p className="muted">Gere questões com a IA para começar a sessão.</p>
            <button
              type="button"
              className="primary-button small button-with-spinner"
              onClick={gerarMaisQuestoes}
              disabled={isGerando}
            >
              {isGerando ? <Spinner size={14} label="Gerando" /> : <Sparkles size={14} />}
              <span>{isGerando ? 'Gerando com IA...' : 'Gerar questões'}</span>
            </button>
          </div>
        </section>
      ) : (
        <>
          {sessao.precisa_gerar_questoes ? (
            <section className="content-card sessao-aviso">
              <div>
                <strong>
                  Este conteúdo tem {sessao.total_disponivel} questões, e a recomendação é de{' '}
                  {sessao.quantidade_solicitada}.
                </strong>
                <p className="muted">
                  Gere mais {sessao.faltam} com a IA para completar a sessão, ou continue com as que
                  já existem.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button small button-with-spinner"
                onClick={gerarMaisQuestoes}
                disabled={isGerando}
              >
                {isGerando ? <Spinner size={14} label="Gerando" /> : <Sparkles size={14} />}
                <span>{isGerando ? 'Gerando...' : 'Gerar mais questões'}</span>
              </button>
            </section>
          ) : null}

          <QuestaoQuiz
            questoes={sessao.questoes}
            onConcluir={aoConcluir}
            renderContexto={(questao) => (
              <div className="quiz-contexto">
                <span className="quiz-contexto-conteudo">{STATUS_ROTULO[questao.status]}</span>
                <AssuntoTag assunto={questao.assunto} />
              </div>
            )}
            renderResultado={({ totalAcertos, total, refazer }) => (
              <ResultadoSessao
                titulo="Sessão concluída"
                totalAcertos={totalAcertos}
                total={total}
                antes={itemDoPlano(planoAntes)}
                depois={itemDoPlano(planoDepois)}
                proximaAcao={proximoItem?.acoes?.[0] || null}
                proximoTitulo={
                  proximoItem
                    ? `${proximoItem.conteudo_titulo} · prioridade ${proximoItem.prioridade === 'media' ? 'média' : proximoItem.prioridade}`
                    : null
                }
                onRefazer={refazer}
              />
            )}
          />
        </>
      )}
    </main>
  );
}

export default SessaoEstudoPage;
