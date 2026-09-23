import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Skeleton, { SkeletonText } from '../shared/Skeleton';
import QuestaoQuiz, { AssuntoTag } from '../shared/QuestaoQuiz';
import ResultadoSessao from '../shared/ResultadoSessao';
import { planoEstudoService } from '../services/planoEstudoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';

function DiagnosticoPage() {
  useDocumentTitle('Questões de diagnóstico');

  const [diagnostico, setDiagnostico] = useState(null);
  const [planoDepois, setPlanoDepois] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setPlanoDepois(null);
    try {
      setDiagnostico(await planoEstudoService.diagnostico());
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aoConcluir = async () => {
    setPlanoDepois(await planoEstudoService.get().catch(() => null));
  };

  const primeiroItem = planoDepois?.itens?.[0] || null;
  const planoLiberado = planoDepois?.status === 'ok';

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            <Link to="/plano" className="back-link">
              <ArrowLeft size={14} /> Meu plano
            </Link>
          </p>
          <h1>Questões de diagnóstico</h1>
          <p className="dashboard-copy">
            {diagnostico?.mensagem ||
              'Responda algumas questões para o StudyAI identificar seus pontos fortes e suas dificuldades.'}
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
      ) : !diagnostico ? null : diagnostico.questoes.length === 0 ? (
        <section className="content-card">
          <div className="empty-state">
            <Compass size={36} className="empty-state-svg" aria-hidden="true" />
            <strong>Nenhuma questão nova para o diagnóstico</strong>
            <p className="muted">{diagnostico.mensagem}</p>
            <Link to="/dashboard" className="primary-button small button-with-spinner">
              <span>Escolher um conteúdo</span>
            </Link>
          </div>
        </section>
      ) : (
        <QuestaoQuiz
          questoes={diagnostico.questoes}
          onConcluir={aoConcluir}
          renderContexto={(questao) => (
            <div className="quiz-contexto">
              <span className="quiz-contexto-conteudo">
                {questao.materia_nome} · {questao.conteudo_titulo}
              </span>
              <AssuntoTag assunto={questao.assunto} />
            </div>
          )}
          renderResultado={({ totalAcertos, total, refazer }) => (
            <ResultadoSessao
              titulo={planoLiberado ? 'Diagnóstico pronto' : 'Diagnóstico atualizado'}
              totalAcertos={totalAcertos}
              total={total}
              proximaAcao={planoLiberado ? primeiroItem?.acoes?.[0] || null : null}
              proximoTitulo={
                planoLiberado && primeiroItem
                  ? `${primeiroItem.conteudo_titulo} · prioridade ${primeiroItem.prioridade === 'media' ? 'média' : primeiroItem.prioridade}`
                  : null
              }
              onRefazer={refazer}
            />
          )}
        />
      )}
    </main>
  );
}

export default DiagnosticoPage;
