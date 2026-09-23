# StudyAI

Assistente inteligente para estudantes de concursos públicos transformarem conteúdo teórico em material de estudo ativo (resumo, pontos-chave, questões e flashcards) com apoio de IA generativa (Google Gemini).

> **Status: em evolução.** MVP completo (Sprints 1–5 + extras) e, na evolução do produto, Plano de Estudo, caderno de erros, diagnóstico por assunto e painel de orientação já entregues.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Como rodar do zero (guia do Felipe)](#como-rodar-do-zero-guia-do-felipe)
- [Testes](#testes)
- [Preparação para apresentação](#preparação-para-apresentação)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Status do projeto](#status-do-projeto)

---

## Funcionalidades

### Fluxo principal
1. **Cadastro/login** com JWT, validação customizada em pt-BR e rotas protegidas.
2. **Matérias** — criar, listar, editar e excluir (cascade nos conteúdos vinculados).
3. **Conteúdos** — criar colando texto **ou anexando PDF/TXT** (extração no navegador via `pdfjs-dist` carregado dinamicamente).
4. **Geração com IA** (Google Gemini): em um clique gera resumo, pontos-chave, questões com alternativas e flashcards. Indicadores em tempo real das 4 etapas.
5. **Resolução de questões** com correção automática e feedback (alternativa correta destacada em verde) e justificativa gerada pela IA para cada alternativa.
6. **Flashcards** com flip 3D, marcação de revisão por usuário e indicador de progresso (dots no deck).
7. **Tarefas de estudo** com prazo, urgência calculada (vencida/urgente/próxima/normal/concluída) e badges coloridas.
8. **Desempenho** com taxa de acerto geral, recorte por matéria, evolução diária e **drill-down por matéria** mostrando taxa por conteúdo (`/desempenho/materias/:id`).
9. **Meu plano** (`/plano`) — plano de estudo personalizado calculado a partir das respostas registradas. A prioridade de cada conteúdo combina taxa de acerto, tendência nas últimas questões, sessões com erro, tempo sem estudar e erros recorrentes, com justificativa que explica cada sinal e o assunto em que o aluno mais erra. Abaixo de 10 respostas no total, orienta questões de diagnóstico em vez de recomendar sem base. Detalhes em `docs/DADOS-DESEMPENHO.md`.
10. **Caderno de erros** (`/erros`) — toda questão errada entra no caderno e fica **pendente** até ser acertada de novo. Tem resumo por matéria, conteúdo e assunto, filtros e modo de refazer com a justificativa de cada alternativa.
11. **Sessão de questões recomendada** (`/plano/sessao`) — monta a lista de questões do conteúdo priorizando as não respondidas e os erros pendentes, e oferece gerar mais questões com a IA quando faltam. Ao terminar, mostra o placar, o que mudou no diagnóstico e a próxima ação.
12. **Questões de diagnóstico** (`/plano/diagnostico`) — para quem ainda não respondeu o suficiente, sorteia questões inéditas e informa quantas respostas faltam para o plano ser gerado.
13. **Painel de orientação** no dashboard — três blocos: como você está (taxa, evolução de 7 dias e matérias), onde focar (conteúdos prioritários, erros e revisões) e o que fazer agora (as três próximas atividades, com link direto).
14. **Registro de estudo** — abrir resumo, pontos-chave, flashcards, questões ou o conteúdo é registrado, e a recência do plano passa a considerar o estudo, não só a última resposta.

### Robustez e qualidade
- **Cache de IA por hash sha256** do prompt (`ia_cache`) — sem custo de cota quando o mesmo pedido se repete.
- **Geração sempre nova**: ao gerar de novo, o prompt leva o material já existente com instrução de não repetir, então cada clique produz resumo, pontos-chave, questões e flashcards diferentes.
- **Retry com backoff exponencial** (3 tentativas) em erros 429/5xx do Gemini.
- **Schema aplicado no startup** (`src/config/initDb.js`) — não depende de scripts manuais.
- **Validações** consistentes nos DTOs (senha mín 6 chars, texto 20–50.000 chars, etc.).
- **Tratamento global de erros**: backend com `errorHandler` e log estruturado; frontend com `ErrorBoundary` + mensagens amigáveis por status HTTP.

### Visual e UX
- Design tokens em `:root` (paleta slate moderna), tipografia Inter, ícones lucide-react.
- TopBar persistente com navegação, perfil unificado e estado ativo realçado.
- Empty states ricos em todas as telas com CTA contextual.
- Skeleton loaders durante carregamento das listas.
- Microinterações: hover lift, fade-in escalonado, focus rings, pulse no CTA de IA, gradient verde→laranja→vermelho nas barras de desempenho.

---

## Stack

**Backend** — Node.js 24 LTS + Express 5 + PostgreSQL 16 (via `pg`, sem ORM) + JWT/bcrypt 6 + Google Generative AI SDK + Jest 30 + Supertest

**Frontend** — React 19 + Vite 8 + React Router 7 + Context API + lucide-react 1 + pdfjs-dist 6 (lazy) + CSS custom com design tokens

**Infra** — Docker Compose com 3 serviços (`db`, `backend`, `frontend`)

---

## Como rodar do zero (guia do Felipe)

### Pré-requisitos
- [Docker Desktop](https://docs.docker.com/get-docker/) instalado e rodando
- Conta no Google AI Studio para gerar a chave do Gemini (gratuita)

### Passo 1 — Clonar e configurar `.env`

```bash
git clone https://github.com/FelipeRP27/StudyAI.git
cd StudyAI
git checkout dev
cp .env.example .env
```

### Passo 2 — Gerar e colar a chave do Gemini no `.env`

1. Abrir [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Clicar **Create API key** → copiar
3. Editar o `.env` e preencher:
   ```
   GEMINI_API_KEY=AIza...        # cola sua chave aqui
   GEMINI_MODEL=gemini-2.5-flash
   ```
   > Mantenha `gemini-2.5-flash`. O `2.0-flash` está com cota zerada e dará erro.

### Passo 3 — Subir tudo

```bash
docker compose up -d --build
```

Esperado: 3 containers `studyai_db`, `studyai_backend`, `studyai_frontend` rodando. O backend aplica o schema automaticamente no startup.

### Passo 4 — Conferir que subiu

```bash
docker compose ps                              # 3 containers Up, db healthy
docker logs studyai_backend --tail 5           # deve mostrar:
#   Schema aplicado com sucesso (CREATE TABLE IF NOT EXISTS).
#   StudyAI backend running on port 3000
```

Abrir [http://localhost:5173](http://localhost:5173) — deve aparecer a tela de login.

### Passo 5 — (Opcional) Popular com dados de demo

Para já ter um usuário com matérias, conteúdos, questões respondidas e tarefas prontas:

```bash
docker exec -i studyai_db psql -U postgres -d studyai < src/config/seed.sql
```

Login: `demo@studyai.com` · senha: `demo1234`

### Comandos úteis

```bash
docker compose down                  # parar os containers
docker compose down -v               # parar E apagar o banco (reset total)
docker compose logs -f backend       # acompanhar logs do backend
docker compose restart frontend      # recarregar só o frontend
docker exec -it studyai_db psql -U postgres -d studyai   # abrir psql no banco
docker exec studyai_backend node src/scripts/classificarAssuntos.js   # classifica pela IA o assunto das questoes antigas
```

### Troubleshooting

- **Erro 522 do Docker Hub ao buildar** — instabilidade do Docker Hub. Aguarde 2 min e rode `docker compose up -d --build` de novo. Se persistir, faça `docker login`.
- **`relation "X" does not exist`** — o backend não conseguiu aplicar o schema. Reinicie: `docker compose restart backend`.
- **`Provedor de IA indisponivel`** — cota/instabilidade do Gemini. O retry já tenta 3x; aguarde 1 min e tente de novo. Se for crônico, troque a `GEMINI_API_KEY` por uma nova conta.
- **Frontend não conecta no backend** — confirme que `VITE_API_URL` está em `http://localhost:3000/api/v1`.

---

## Testes

```bash
npm install        # apenas na primeira vez ou após mudar deps
npm test
```

**126 testes** em 19 suites, cobrindo:
- **Sprint 3** — `iaService`, `resumoService`, `pontoChaveService`, `questaoService`, `flashcardService`, `processamentoService`
- **Sprint 4** — `respostaService`, `tarefaService`, `tarefaOutputDto`
- **Sprint 5 / pós** — `desempenhoService` (com drill-down por matéria), retry/cache do `iaService`
- **Plano de Estudo** — `analiseDesempenhoService` (taxa, prioridade, recência, tendência, sessões com erro, assuntos difíceis), `planoEstudoService`
- **Caderno de erros** — `cadernoErrosService`, `cadernoErrosInputDto`, `assuntoQuestaoService`
- **Orientação** — `sessaoEstudoService` (sessão e diagnóstico), `painelService`, `atividadeEstudoService`
- **App HTTP** — `app.test.js` com Supertest (corpo ausente → 400, rota inexistente → 404, filtros e tipos inválidos → 400, sem token → 401)

Tudo com mocks de Gemini e dos repositórios (não chama IA real nem precisa de banco).

---

## Preparação para apresentação

Checklist 5 min antes da demo:

1. `docker compose ps` confirmando os 3 containers `Up` e o `db` `healthy`.
2. `docker logs studyai_backend --tail 5` mostra `Schema aplicado com sucesso`.
3. Rodar o seed (passo 5 acima) caso queira partir com dados prontos.
4. Logar com `demo@studyai.com` · `demo1234`.
5. **Esquentar o cache de IA**: clicar "Gerar estudo" em algum conteúdo antes da apresentação — a próxima execução do mesmo conteúdo retorna instantâneo (lookup no `ia_cache` via hash sha256 do prompt).

Roteiro sugerido de demo:
- Dashboard (stat-chips, atalhos, matérias com stripes coloridas)
- Entrar numa matéria → card de desempenho contextual → criar conteúdo **anexando um PDF**
- Clicar "Gerar estudo" → mostrar as 4 etapas em tempo real
- Aba "Questões" → tela dedicada → responder uma certa e outra errada (feedback colorido)
- Aba "Flashcards" → flip 3D + marcar como revisado + dots de progresso
- Dashboard → painel de orientação: como você está, onde focar e o que fazer agora
- `/plano` → prioridades com tendência, assuntos difíceis e ações com link direto
- `/erros` → caderno de erros, filtros e refazer os pendentes
- `/plano/sessao` → sessão de questões recomendada e resultado com o diagnóstico atualizado
- `/desempenho` → clicar numa matéria para ver o drill-down com taxa por conteúdo
- `/tarefas` → criar tarefa com prazo no passado (vira "vencida" vermelha)

---

## Arquitetura

Camadas rígidas, do topo para a base:

```
Controller  →  Service  →  Repository  →  PostgreSQL
                  ↓
              iaService  →  ia_cache (lookup) → Gemini
```

- **Controllers** só validam formato e despacham (sem lógica de negócio).
- **Services** têm a regra de negócio. Validação de **ownership** obrigatória em todo acesso a recurso de usuário (`ensureConteudoOwnership`, `ensureMateriaOwnership`, `ensureQuestaoOwnership`, `ensureFlashcardOwnership`, `ensureTarefaOwnership`).
- **Repositories** só conversam com o banco usando queries parametrizadas. Nada de ORM.
- **DTOs** em `src/dtos/` padronizam input e output. Nunca devolve objeto cru do banco.
- **Erros** via `AppError` + `errorHandler` middleware.

---

## Estrutura de pastas

```
StudyAI/
├── src/                            # backend
│   ├── controllers/                # handlers HTTP
│   ├── services/                   # regra de negócio + iaService central
│   ├── repositories/               # pg parametrizado, sem ORM
│   ├── routes/                     # definição + middleware auth
│   ├── dtos/                       # input/output normalizados
│   ├── middlewares/                # authMiddleware, errorHandler
│   ├── config/                     # env, appError, database, schema.sql, seed.sql, initDb
│   └── __tests__/                  # Jest com mocks
├── frontend/
│   └── src/
│       ├── pages/                  # 14 páginas (Login, Register, Dashboard,
│       │                           # Materia, Conteudo, Questoes, Flashcards,
│       │                           # MeuPlano, CadernoErros, SessaoEstudo,
│       │                           # Diagnostico, Desempenho, DesempenhoMateria,
│       │                           # Tarefas)
│       ├── contexts/               # AuthContext
│       ├── services/               # api.js + um service por recurso
│       ├── router/                 # AppRouter + ProtectedRoute (envolve TopBar) + PublicRoute
│       ├── shared/                 # TopBar, ErrorBoundary, Spinner, Skeleton,
│       │                           # CopyButton, PasswordInput, AuthShell,
│       │                           # useDocumentTitle, colorPalette, extractTextFromFile
│       └── styles/global.css       # design tokens em :root
├── docs/                           # documentação do produto
│   ├── FUNCIONALIDADES.md          # planejamento das sprints 6 a 10
│   ├── DADOS-DESEMPENHO.md         # dados que alimentam o Plano de Estudo
│   └── StudyAI-Analise-do-Produto.pdf
├── docker-compose.yml
├── Dockerfile
├── frontend/Dockerfile
└── README.md
```

---

## Status do projeto

| Sprint | Tema | Status |
|---|---|---|
| 1 | Planejamento | ✅ Concluída |
| 2 | MVP (auth, CRUD matérias/conteúdos) | ✅ Concluída |
| 3 | Integração com IA (Gemini, geração, Docker, testes) | ✅ Concluída |
| 4 | Estudo ativo (respostas, desempenho, tarefas, telas dedicadas) | ✅ Concluída |
| 5 | Estabilização (cache IA, validações, erros globais, polimento, seed) | ✅ Concluída |
| Pós | CRUD matéria no frontend, drill-down desempenho, anexo PDF/TXT, reforma visual completa (Inter, ícones, skeletons, design tokens slate) | ✅ Concluída |
| Evolução 1 | Plano de Estudo personalizado (análise de desempenho por conteúdo, página Meu Plano, histórico no seed) | ✅ Concluída |
| Evolução 2 | Assunto por questão, caderno de erros, priorização com vários fatores e diagnóstico por matéria | ✅ Concluída |
| Evolução 3 | Registro de estudo, recomendações com link, sessão de questões, diagnóstico e painel de orientação | ✅ Concluída |
| Evolução 4 | Testes e estabilização | ⏳ Planejada |
| Evolução 5 | Documentação e apresentação | ⏳ Planejada |

---

## Autores

- **Liam Coifman Rodrigues** — backend, IA, infra
- **Felipe Ramalho Perdigão** — frontend, validação, demo
