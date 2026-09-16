-- Dados de demonstracao para apresentacao do StudyAI.
-- Idempotente: usa ON CONFLICT para nao duplicar se rodado mais de uma vez.
--
-- Credenciais do usuario demo:
--   email: demo@studyai.com
--   senha: demo1234
--
-- Como aplicar:
--   docker exec -i studyai_db psql -U postgres -d studyai < src/config/seed.sql

INSERT INTO usuarios (id, nome, email, senha)
VALUES (
  1000,
  'Aluno Demo',
  'demo@studyai.com',
  '$2b$10$Ben.xwLQgfm/vWw3oe9u9uD7Y91YLfGBPG0rGlhUSbOjBgmwJ7peO'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO materias (id, usuario_id, nome, descricao) VALUES
  (1001, 1000, 'Direito Constitucional', 'Principios fundamentais, organizacao do Estado, direitos e garantias'),
  (1002, 1000, 'Direito Administrativo', 'Atos administrativos, licitacoes, servidores publicos'),
  (1003, 1000, 'Direito Tributario', 'Tributos, competencia tributaria, imunidades e isencoes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO conteudos (id, titulo, texto, materia_id, usuario_id) VALUES
  (
    2001,
    'Principios da Administracao Publica',
    'A Administracao Publica obedece aos principios da legalidade, impessoalidade, moralidade, publicidade e eficiencia (LIMPE), conforme o art. 37 da Constituicao Federal. A legalidade impoe que o administrador so pode agir conforme a lei. A impessoalidade exige tratamento isonomico e finalidade publica. A moralidade demanda etica e boa-fe. A publicidade garante transparencia. A eficiencia busca otimizacao dos recursos publicos.',
    1002,
    1000
  ),
  (
    2002,
    'Direitos Fundamentais',
    'Os direitos fundamentais sao classificados em direitos individuais, sociais, politicos, da nacionalidade e coletivos. Estao previstos principalmente no art. 5 da CF/88. Os direitos individuais incluem vida, liberdade, igualdade, seguranca e propriedade. Sao caracterizados pela universalidade, historicidade, inalienabilidade e irrenunciabilidade. A aplicabilidade e imediata para os direitos fundamentais de primeira dimensao.',
    1001,
    1000
  ),
  (
    2003,
    'Imunidades Tributarias',
    'As imunidades tributarias sao limitacoes constitucionais ao poder de tributar, previstas no art. 150, VI da CF. Sao imunes a impostos: patrimonio, renda ou servicos dos entes federativos (imunidade reciproca); templos de qualquer culto; partidos politicos, fundacoes, sindicatos de trabalhadores e entidades de educacao e assistencia social sem fins lucrativos; livros, jornais, periodicos e o papel destinado a sua impressao.',
    1003,
    1000
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO resumos (conteudo_id, texto) VALUES
  (2001, 'A Administracao Publica e regida pelos principios LIMPE (Legalidade, Impessoalidade, Moralidade, Publicidade, Eficiencia), previstos no art. 37 da CF/88.'),
  (2002, 'Direitos fundamentais agrupam direitos individuais, sociais, politicos e coletivos. Tem aplicabilidade imediata, sao universais, historicos, inalienaveis e irrenunciaveis.'),
  (2003, 'Imunidades sao limitacoes constitucionais ao poder de tributar. Cobrem entes federativos, templos, partidos, sindicatos, entidades educacionais/assistenciais sem fins lucrativos e livros/jornais/periodicos.');

INSERT INTO pontos_chave (conteudo_id, texto) VALUES
  (2001, 'LIMPE = Legalidade, Impessoalidade, Moralidade, Publicidade, Eficiencia.'),
  (2001, 'Previsto no art. 37 da CF/88.'),
  (2001, 'Legalidade restringe agir do administrador a previsao legal.'),
  (2002, 'Direitos fundamentais sao universais, historicos, inalienaveis e irrenunciaveis.'),
  (2002, 'Art. 5 da CF/88 e o nucleo principal.'),
  (2003, 'Imunidade reciproca protege patrimonio, renda e servicos entre os entes federativos.'),
  (2003, 'Imunidade abrange livros, jornais e periodicos.');

INSERT INTO questoes (id, conteudo_id, enunciado) VALUES
  (3001, 2001, 'Qual o conjunto de principios expressos da Administracao Publica no art. 37 da CF/88?'),
  (3002, 2003, 'A imunidade tributaria recipoca alcanca qual tipo de tributo?'),
  (3003, 2002, 'Qual caracteristica NAO se aplica aos direitos fundamentais?')
ON CONFLICT (id) DO NOTHING;

INSERT INTO alternativas (questao_id, texto, is_correta, justificativa) VALUES
  (3001, 'Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiencia', TRUE,
    'Esses sao exatamente os cinco principios expressos no caput do art. 37 da CF/88, conhecidos pela sigla LIMPE.'),
  (3001, 'Legalidade, Igualdade, Mobilidade, Probidade e Economicidade', FALSE,
    'Confunde principios proximos: o correto e Impessoalidade (nao Igualdade), e nao existem "Mobilidade" nem "Economicidade" como principios expressos do art. 37.'),
  (3001, 'Legalidade, Independencia, Mediacao, Publicidade e Economicidade', FALSE,
    'Independencia e principio do art. 2 da CF (separacao dos poderes), nao do art. 37; Mediacao e Economicidade tambem nao integram os principios expressos da Administracao Publica.'),
  (3001, 'Liberdade, Imparcialidade, Moralidade, Publicidade e Eficiencia', FALSE,
    'O principio correto e Legalidade (nao Liberdade) e Impessoalidade (nao Imparcialidade). Os outros tres estao certos, mas a alternativa erra nos dois primeiros.'),
  (3002, 'Impostos', TRUE,
    'O art. 150, VI da CF veda a Uniao, Estados, DF e Municipios "instituir impostos" sobre os entes federativos, templos, partidos, etc. A imunidade reciproca alcanca somente impostos.'),
  (3002, 'Taxas', FALSE,
    'Taxas tem fato gerador em servico publico especifico ou exercicio do poder de policia; nao sao alcancadas pela imunidade reciproca, que se limita a impostos (art. 150, VI, "a" da CF).'),
  (3002, 'Contribuicoes de melhoria', FALSE,
    'Contribuicao de melhoria decorre de obra publica que valoriza imovel; tambem nao e alcancada pela imunidade reciproca, restrita aos impostos.'),
  (3002, 'Emprestimos compulsorios', FALSE,
    'Emprestimos compulsorios sao tributos instituidos pela Uniao em situacoes excepcionais (art. 148 CF) e nao se enquadram na imunidade reciproca, que cobre apenas impostos.'),
  (3003, 'Transferibilidade a terceiros', TRUE,
    'Os direitos fundamentais sao inalienaveis e irrenunciaveis, ou seja, nao podem ser transferidos ou negociados. Essa e a caracteristica que NAO se aplica a eles.'),
  (3003, 'Universalidade', FALSE,
    'A universalidade se aplica: os direitos fundamentais alcancam todas as pessoas, independentemente de nacionalidade ou condicao.'),
  (3003, 'Historicidade', FALSE,
    'A historicidade se aplica: os direitos fundamentais resultam de um processo historico e se ampliam ao longo do tempo, em dimensoes sucessivas.'),
  (3003, 'Irrenunciabilidade', FALSE,
    'A irrenunciabilidade se aplica: o titular nao pode abrir mao dos seus direitos fundamentais, ainda que queira.');

INSERT INTO flashcards (conteudo_id, frente, verso) VALUES
  (2001, 'O que significa LIMPE?', 'Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiencia'),
  (2001, 'Onde estao previstos os principios da Administracao Publica?', 'Art. 37 da Constituicao Federal'),
  (2002, 'Quais as caracteristicas dos direitos fundamentais?', 'Universais, historicos, inalienaveis, irrenunciaveis, com aplicabilidade imediata'),
  (2003, 'O que sao imunidades tributarias?', 'Limitacoes constitucionais ao poder de tributar previstas no art. 150, VI da CF/88');

INSERT INTO tarefas (usuario_id, materia_id, titulo, descricao, data_limite, status) VALUES
  (1000, 1001, 'Revisar direitos sociais', 'Capitulos 4 e 5 da apostila', CURRENT_DATE - INTERVAL '1 day', 'pendente'),
  (1000, 1002, 'Resolver questoes de licitacao', 'Foco em modalidades e dispensa', CURRENT_DATE + INTERVAL '2 days', 'pendente'),
  (1000, 1003, 'Estudar imunidades', NULL, CURRENT_DATE + INTERVAL '5 days', 'pendente'),
  (1000, NULL, 'Simulado completo', 'Banca CESPE 2 horas', CURRENT_DATE + INTERVAL '15 days', 'pendente'),
  (1000, 1001, 'Ler doutrina sobre controle de constitucionalidade', NULL, CURRENT_DATE - INTERVAL '7 days', 'concluida');

-- Historico de respostas do usuario demo.
-- Produz as tres faixas de prioridade do plano de estudo:
--   Principios da Administracao Publica -> 13/25 = 52%  (prioridade alta, 12 dias sem responder)
--   Direitos Fundamentais               -> 17/25 = 68%  (prioridade media, 3 dias sem responder)
--   Imunidades Tributarias              -> 21/23 = 91%  (prioridade baixa, 1 dia sem responder)
-- So roda se o usuario demo ainda nao tiver respostas, para nao duplicar o historico.
INSERT INTO respostas_questoes (usuario_id, questao_id, alternativa_id, is_correta, created_at)
SELECT
  1000,
  plano.questao_id,
  (
    SELECT a.id
    FROM alternativas a
    WHERE a.questao_id = plano.questao_id
      AND a.is_correta = (g.i <= plano.acertos)
    LIMIT 1
  ),
  g.i <= plano.acertos,
  NOW() - (plano.dias_atras || ' days')::interval - (g.i || ' hours')::interval
FROM (VALUES
  (3001, 25, 13, 12),
  (3003, 25, 17, 3),
  (3002, 23, 21, 1)
) AS plano(questao_id, total, acertos, dias_atras)
CROSS JOIN LATERAL generate_series(1, plano.total) AS g(i)
WHERE NOT EXISTS (
  SELECT 1 FROM respostas_questoes WHERE usuario_id = 1000
);

-- Assunto das questoes e historico recente para o diagnostico do plano e o caderno de erros.
-- Principios da Administracao Publica: piora recente, erros em varias sessoes e dificuldade
--   em impessoalidade e publicidade (prioridade alta, 1 erro pendente no caderno).
-- Direitos Fundamentais: melhora recente depois de erros antigos (prioridade media).
-- As questoes novas sao identificadas por conteudo + enunciado (sem id fixo) para nao colidir
-- com questoes ja geradas em bancos que receberam o seed antes.
UPDATE questoes SET assunto = 'Principios expressos do art. 37' WHERE id = 3001 AND assunto IS NULL;
UPDATE questoes SET assunto = 'Imunidade reciproca' WHERE id = 3002 AND assunto IS NULL;
UPDATE questoes SET assunto = 'Caracteristicas dos direitos fundamentais' WHERE id = 3003 AND assunto IS NULL;

CREATE TEMP TABLE seed_questoes_diagnostico (
  chave VARCHAR(20) PRIMARY KEY,
  conteudo_id INTEGER NOT NULL,
  enunciado TEXT NOT NULL,
  assunto VARCHAR(120) NOT NULL
);

INSERT INTO seed_questoes_diagnostico (chave, conteudo_id, enunciado, assunto) VALUES
  ('impessoalidade', 2001, 'Segundo o principio da impessoalidade, a atuacao do agente publico deve:', 'Principio da impessoalidade'),
  ('publicidade', 2001, 'O principio da publicidade exige que os atos da Administracao sejam:', 'Principio da publicidade'),
  ('aplicabilidade', 2002, 'Sobre a aplicabilidade das normas definidoras dos direitos fundamentais, e correto afirmar que:', 'Aplicabilidade imediata');

INSERT INTO questoes (conteudo_id, enunciado, assunto)
SELECT seed.conteudo_id, seed.enunciado, seed.assunto
FROM seed_questoes_diagnostico seed
WHERE NOT EXISTS (
  SELECT 1 FROM questoes q WHERE q.conteudo_id = seed.conteudo_id AND q.enunciado = seed.enunciado
);

INSERT INTO alternativas (questao_id, texto, is_correta, justificativa)
SELECT q.id, nova.texto, nova.is_correta, nova.justificativa
FROM (VALUES
  ('impessoalidade', 'Atender ao interesse publico, sem favorecer ou prejudicar pessoas determinadas', TRUE,
    'A impessoalidade exige finalidade publica e tratamento isonomico: o agente nao pode agir para beneficiar ou perseguir alguem.'),
  ('impessoalidade', 'Seguir a preferencia pessoal do administrador quando a lei for omissa', FALSE,
    'A omissao legal nao autoriza preferencias pessoais; isso violaria justamente a impessoalidade e a legalidade.'),
  ('impessoalidade', 'Priorizar os cidadaos que colaboraram com a gestao atual', FALSE,
    'Favorecer apoiadores e o exemplo classico de desvio de finalidade, vedado pelo principio da impessoalidade.'),
  ('impessoalidade', 'Divulgar o nome do agente em obras e campanhas publicas', FALSE,
    'A promocao pessoal de autoridades em publicidade oficial e proibida pelo art. 37, par. 1, da CF, justamente por ofender a impessoalidade.'),
  ('publicidade', 'Divulgados oficialmente, garantindo transparencia, salvo as hipoteses de sigilo previstas em lei', TRUE,
    'A publicidade e a regra e da eficacia e controle aos atos; o sigilo so e admitido nas excecoes legais.'),
  ('publicidade', 'Sempre sigilosos ate o fim do mandato do gestor', FALSE,
    'O sigilo e excecao, nunca regra; manter os atos ocultos contraria a transparencia exigida pelo art. 37.'),
  ('publicidade', 'Publicados apenas quando o cidadao fizer requerimento formal', FALSE,
    'A publicidade independe de provocacao: a divulgacao oficial e dever da Administracao.'),
  ('publicidade', 'Divulgados com destaque para o nome da autoridade responsavel', FALSE,
    'Confunde publicidade com promocao pessoal, que e vedada pela Constituicao.'),
  ('aplicabilidade', 'Tem aplicacao imediata, conforme o art. 5, par. 1, da CF', TRUE,
    'O par. 1 do art. 5 determina que as normas definidoras de direitos e garantias fundamentais tem aplicacao imediata.'),
  ('aplicabilidade', 'Dependem sempre de lei regulamentadora para produzir efeitos', FALSE,
    'A regra constitucional e a aplicacao imediata; exigir lei em todos os casos inverte o comando do art. 5, par. 1.'),
  ('aplicabilidade', 'Aplicam-se apenas aos brasileiros natos', FALSE,
    'Os direitos fundamentais alcancam brasileiros e estrangeiros residentes; a questao tambem nao trata de titularidade, e sim de aplicabilidade.'),
  ('aplicabilidade', 'So produzem efeitos apos aprovacao por emenda constitucional', FALSE,
    'Os direitos ja estao na Constituicao e tem eficacia imediata; nao dependem de nova emenda.')
) AS nova(chave, texto, is_correta, justificativa)
INNER JOIN seed_questoes_diagnostico seed ON seed.chave = nova.chave
INNER JOIN questoes q ON q.conteudo_id = seed.conteudo_id AND q.enunciado = seed.enunciado
WHERE NOT EXISTS (
  SELECT 1 FROM alternativas a WHERE a.questao_id = q.id
);

INSERT INTO respostas_questoes (usuario_id, questao_id, alternativa_id, is_correta, created_at)
SELECT
  1000,
  q.id,
  (
    SELECT a.id
    FROM alternativas a
    WHERE a.questao_id = q.id
      AND a.is_correta = historico.correta
    ORDER BY a.id
    LIMIT 1
  ),
  historico.correta,
  DATE_TRUNC('day', NOW()) - (historico.dias_atras || ' days')::interval + (historico.hora || ' hours')::interval
FROM (VALUES
  ('impessoalidade', 5, 20, FALSE), ('impessoalidade', 5, 21, FALSE), ('impessoalidade', 3, 20, FALSE),
  ('impessoalidade', 3, 21, TRUE),  ('impessoalidade', 1, 20, FALSE), ('impessoalidade', 1, 21, FALSE),
  ('publicidade', 3, 22, FALSE), ('publicidade', 1, 22, FALSE), ('publicidade', 1, 23, TRUE),
  ('aplicabilidade', 20, 10, FALSE), ('aplicabilidade', 20, 11, FALSE), ('aplicabilidade', 2, 10, TRUE),
  ('aplicabilidade', 1, 10, TRUE),  ('aplicabilidade', 1, 11, TRUE)
) AS historico(chave, dias_atras, hora, correta)
INNER JOIN seed_questoes_diagnostico seed ON seed.chave = historico.chave
INNER JOIN questoes q ON q.conteudo_id = seed.conteudo_id AND q.enunciado = seed.enunciado
WHERE NOT EXISTS (
  SELECT 1
  FROM respostas_questoes r
  INNER JOIN questoes existente ON existente.id = r.questao_id
  INNER JOIN seed_questoes_diagnostico marcada
    ON marcada.conteudo_id = existente.conteudo_id AND marcada.enunciado = existente.enunciado
  WHERE r.usuario_id = 1000
);

DROP TABLE seed_questoes_diagnostico;

SELECT setval('usuarios_id_seq', GREATEST((SELECT MAX(id) FROM usuarios), 1000));
SELECT setval('materias_id_seq', GREATEST((SELECT MAX(id) FROM materias), 1003));
SELECT setval('conteudos_id_seq', GREATEST((SELECT MAX(id) FROM conteudos), 2003));
SELECT setval('questoes_id_seq', GREATEST((SELECT MAX(id) FROM questoes), 3003));
