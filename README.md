# StudyAI

Assistente inteligente para estudantes de concursos públicos transformarem conteúdo teórico em material de estudo ativo (resumo, pontos-chave, questões e flashcards) com apoio de IA generativa (Google Gemini).

> **Status: MVP completo.** Sprints 1–5 entregues + reformulação visual final + extras pós-sprint. Pronto para apresentação.

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
5. **Resolução de questões** com correção automática e feedback (alternativa correta destacada em verde).
6. **Flashcards** com flip 3D, marcação de revisão por usuário e indicador de progresso (dots no deck).
7. **Tarefas de estudo** com prazo, urgência calculada (vencida/urgente/próxima/normal/concluída) e badges coloridas.
8. **Desempenho** com taxa de acerto geral, recorte por matéria, evolução diária e **drill-down por matéria** mostrando taxa por conteúdo (`/desempenho/materias/:id`).

### Robustez e qualidade
- **Cache de IA por hash sha256** do prompt (`ia_cache`) — re-gerar o mesmo conteúdo retorna instantâneo, sem custo de cota.
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

**Backend** — Node.js 20 + Express + PostgreSQL 16 (via `pg`, sem ORM) + JWT/bcrypt + Google Generative AI SDK + Jest

**Frontend** — React 18 + Vite 5 + React Router 6 + Context API + lucide-react + pdfjs-dist (lazy) + CSS custom com design tokens

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

**58 testes** em 10 suites, cobrindo:
- **Sprint 3** — `iaService`, `resumoService`, `pontoChaveService`, `questaoService`, `flashcardService`, `processamentoService`
- **Sprint 4** — `respostaService`, `tarefaService`, `tarefaOutputDto`
- **Sprint 5 / pós** — `desempenhoService` (com drill-down por matéria), retry/cache do `iaService`

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
│       ├── pages/                  # 10 páginas (Login, Register, Dashboard,
│       │                           # Materia, Conteudo, Questoes, Flashcards,
│       │                           # Desempenho, DesempenhoMateria, Tarefas)
│       ├── contexts/               # AuthContext
│       ├── services/               # api.js + um service por recurso
│       ├── router/                 # AppRouter + ProtectedRoute (envolve TopBar) + PublicRoute
│       ├── shared/                 # TopBar, ErrorBoundary, Spinner, Skeleton,
│       │                           # CopyButton, PasswordInput, AuthShell,
│       │                           # useDocumentTitle, colorPalette, extractTextFromFile
│       └── styles/global.css       # design tokens em :root
├── docker-compose.yml
├── Dockerfile
├── frontend/Dockerfile
├── README.md
└── CLAUDE.md                       # guia interno para sessões com Claude
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

---

## Autores

- **Liam Coifman Rodrigues** — backend, IA, infra
- **Felipe Ramalho Perdigão** — frontend, validação, demo
