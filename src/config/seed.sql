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
  (3002, 2003, 'A imunidade tributaria recipoca alcanca qual tipo de tributo?')
ON CONFLICT (id) DO NOTHING;

INSERT INTO alternativas (questao_id, texto, is_correta) VALUES
  (3001, 'Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiencia', TRUE),
  (3001, 'Legalidade, Igualdade, Mobilidade, Probidade e Economicidade', FALSE),
  (3001, 'Legalidade, Independencia, Mediacao, Publicidade e Economicidade', FALSE),
  (3001, 'Liberdade, Imparcialidade, Moralidade, Publicidade e Eficiencia', FALSE),
  (3002, 'Impostos', TRUE),
  (3002, 'Taxas', FALSE),
  (3002, 'Contribuicoes de melhoria', FALSE),
  (3002, 'Emprestimos compulsorios', FALSE);

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

SELECT setval('usuarios_id_seq', GREATEST((SELECT MAX(id) FROM usuarios), 1000));
SELECT setval('materias_id_seq', GREATEST((SELECT MAX(id) FROM materias), 1003));
SELECT setval('conteudos_id_seq', GREATEST((SELECT MAX(id) FROM conteudos), 2003));
SELECT setval('questoes_id_seq', GREATEST((SELECT MAX(id) FROM questoes), 3002));
