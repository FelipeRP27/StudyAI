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

SELECT setval('usuarios_id_seq', GREATEST((SELECT MAX(id) FROM usuarios), 1000));
SELECT setval('materias_id_seq', GREATEST((SELECT MAX(id) FROM materias), 1003));
SELECT setval('conteudos_id_seq', GREATEST((SELECT MAX(id) FROM conteudos), 2003));
SELECT setval('questoes_id_seq', GREATEST((SELECT MAX(id) FROM questoes), 3003));
