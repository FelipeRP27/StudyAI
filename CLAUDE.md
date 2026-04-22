# StudyAI — Guia para Claude

Contexto do projeto para sessões do Claude Code. Mantenha este arquivo **curto e atualizado** — ele é carregado em todo turno, então inflar aqui custa tokens em toda conversa.

## O que é o projeto

Plataforma web para estudantes de concursos públicos transformarem conteúdo teórico em material de estudo ativo (resumo, pontos-chave, questões com alternativas, flashcards) com apoio de IA generativa (Google Gemini). Projeto acadêmico, entregue em sprints.

**Autores:** Liam Coifman Rodrigues, Felipe Ramalho Perdigão.

## Stack

- **Backend:** Node.js + Express, PostgreSQL via `pg`, JWT + bcrypt, Google Generative AI SDK
- **Frontend:** React + Vite, React Router, Context API para auth
- **Infra:** Docker + docker-compose (db, backend, frontend)
- **Testes:** Jest (unit, com mocks do Gemini)

## Arquitetura

Camadas rígidas, não atravesse:

```
Controller  →  Service  →  Repository  →  PostgreSQL
                  ↓
              iaService  →  Gemini
```

- **Controllers** só validam formato e despacham; sem lógica de negócio.
- **Services** têm toda a regra de negócio. Serviços chamam outros services quando precisam (ex.: `conteudoOwnershipService`).
- **Repositories** só conversam com o banco, usando queries parametrizadas ($1, $2…). Nada de ORM.
- **DTOs de entrada e saída** em `src/dtos/` padronizam I/O. Nunca devolva objetos crus do banco ao cliente.
- **Tudo que fala com Gemini passa pelo `iaService`** — parser, mapeamento de erro e chamada centralizados.

## Convenções

- **Idioma:** pt-BR em commits, comentários, nomes de variáveis de domínio (`materia`, `conteudo`, `resumo`). Erros de API em inglês por padrão.
- **Commits:** formato `tipo(escopo): descrição curta em pt-BR`. Exemplos no `git log` — seguir o estilo existente. Sem emojis.
- **PRs:** título curto (<70 chars), corpo com Resumo + Cards entregues + Como testar + Checklist.
- **Branches:** uma por sprint (`sprint-N`) ou por feature (`feat/nome`). Base é `dev`.
- **Sem comentários óbvios** no código. Nomes de funções e variáveis devem explicar a intenção.
- **Validação de ownership** em TODO acesso a recurso de usuário: `ensureConteudoOwnership`, `ensureMateriaOwnership`, `ensureQuestaoOwnership`. Nunca consulte direto sem checar o dono.
- **AppError + errorHandler** para erros — nunca deixe vazar stack trace.

## Comandos importantes

```bash
# Subir tudo (docker)
docker compose up -d

# Parar
docker compose down

# Logs
docker compose logs -f backend

# Testes backend (precisa npm install local)
npm test

# Acessar banco
docker exec -it studyai_db psql -U postgres -d studyai

# Frontend dev local
cd frontend && npm run dev
```

## Variáveis de ambiente

Arquivo `.env` na raiz (copiado de `.env.example`), **nunca commitado**. Chaves:
- `DB_*`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- `GEMINI_API_KEY` (gerada em https://aistudio.google.com/apikey — cada dev a sua)
- `GEMINI_MODEL` — use `gemini-2.5-flash` se `gemini-2.0-flash` der `limit: 0`
- `VITE_API_URL` (usado pelo frontend no docker-compose)

## Estrutura relevante

```
src/
├── controllers/     # handlers HTTP (só roteamento)
├── services/        # regra de negócio
├── repositories/    # acesso ao banco (pg direto)
├── routes/          # definição de rotas + middleware auth
├── dtos/            # input/output normalizados
├── middlewares/     # authMiddleware, errorHandler
├── config/          # env, appError, db, schema.sql
└── __tests__/       # jest (mocks do Gemini, nunca chama IA de verdade)

frontend/src/
├── pages/           # LoginPage, RegisterPage, DashboardPage, MateriaPage, ConteudoPage
├── contexts/        # AuthContext (token em localStorage)
├── services/        # api.js central + service por recurso
├── router/          # AppRouter + ProtectedRoute/PublicRoute
└── shared/          # componentes reutilizáveis
```

## Status de entregas

- Sprint 1 — Planejamento: concluída
- Sprint 2 — MVP backend+frontend (auth, CRUD materias/conteudos): concluída
- Sprint 3 — Integração IA (Gemini, geração de material, histórico, Docker, testes): concluída em `sprint-3` (PR #35)

## O que NÃO fazer

- **Não** refatorar estrutura existente sem o Liam pedir explicitamente.
- **Não** adicionar ORM, linter novo, framework novo — só o que já está aqui.
- **Não** deixar o `.env` ser commitado (já está no `.gitignore`; confira `git status` antes de `git add`).
- **Não** commitar a `GEMINI_API_KEY` em lugar nenhum.
- **Não** mockar o banco em testes futuros de integração — só IA (Gemini) é mockada.
- **Não** usar `git add .` cegamente; prefira adicionar por arquivo para não pegar segredos.
- **Não** iniciar uma sprint sem instruções explícitas do Liam — ele define o escopo de cada entrega.

## Workflow típico

1. Liam passa os cards da sprint
2. Cria-se branch `sprint-N` a partir de `dev`
3. Implementa card a card, seguindo Controller→Service→Repository
4. Testes com Jest (mocks), `npm test` deve ficar verde
5. Atualiza README se mudou comando/dependência
6. Commit em pt-BR, push, PR para `dev`
