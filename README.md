# StudyAI

Assistente Inteligente para Concursos Publicos

## Sobre o Projeto

O StudyAI e uma plataforma desenvolvida para auxiliar estudantes de concursos publicos a transformar conteudos teoricos em materiais de estudo ativos, com apoio de IA generativa (Google Gemini).

## Objetivo

Facilitar o processo de estudo atraves de:

- Organizacao por materias
- Estruturacao de conteudos
- Geracao automatica de materiais:
  - Resumos
  - Pontos-chave
  - Questoes com alternativas
  - Flashcards

## Funcionalidades

### Autenticacao
- Cadastro de usuario
- Login com JWT
- Rotas protegidas

### Materias
- Criar, editar e excluir materias
- Listagem por usuario

### Conteudos
- Insercao de conteudo teorico
- Associacao com materias

### Estrutura de Estudo
- Resumos
- Pontos-chave
- Questoes (com alternativas)
- Flashcards

### Geracao com IA (Sprint 3)
- Integracao com Google Gemini
- Endpoint unificado `POST /api/v1/conteudos/:id/processar` que dispara a geracao em paralelo
- Historico de processamento persistido na tabela `processamentos`
- Frontend com botao "Gerar Estudo", estados de loading e tratamento de erro

### Estudo ativo (Sprint 4)
- **Resolucao de questoes** com correcao automatica (`POST /api/v1/respostas`) e
  feedback imediato exibindo a alternativa correta
- **Flashcards revisados** persistidos por usuario
  (`POST /api/v1/flashcards/:id/revisado`, `DELETE /api/v1/flashcards/:id/revisado`)
- **Desempenho** com taxa de acerto, totais, recorte por materia e evolucao
  diaria (`GET /api/v1/desempenho?dias=30`)
- **Tarefas de estudo** com prazo, status e materia opcional
  (`GET/POST/PUT/PATCH /api/v1/tarefas`); o backend devolve `dias_restantes`
  e `urgencia` (vencida, urgente, proxima, normal, concluida)

### Dashboard
- Visualizacao das materias cadastradas
- Atalhos para Tarefas e Desempenho
- Telas dedicadas: `/conteudos/:id/questoes`, `/conteudos/:id/flashcards`,
  `/desempenho`, `/tarefas`

## Arquitetura

Projeto segue arquitetura em camadas:

- Controller -> Entrada de dados (requisicoes)
- Service -> Regras de negocio
- Repository -> Acesso ao banco de dados
- DTOs -> Padronizacao de dados

## Tecnologias Utilizadas

### Backend
- Node.js / Express
- PostgreSQL (via `pg`)
- JWT (autenticacao)
- bcrypt (criptografia de senha)
- Google Generative AI SDK (Gemini)
- Jest (testes)

### Frontend
- React / Vite
- React Router
- Context API (autenticacao)

### Infra
- Docker + docker-compose (backend, frontend, PostgreSQL)

## Como rodar o projeto

### Opcao 1 - Docker (recomendado)

```bash
cp .env.example .env
# preencha GEMINI_API_KEY em .env
docker-compose up --build
```

Backend em `http://localhost:3000`, frontend em `http://localhost:5173`.

### Opcao 2 - Local

Backend:
```bash
cp .env.example .env
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Testes

```bash
npm test
```

Cobre os servicos da Sprint 3 (iaService, resumoService, pontoChaveService, questaoService, flashcardService, processamentoService) e da Sprint 4 (respostaService, tarefaService, tarefaOutputDto, desempenhoService) com mocks de Gemini e dos repositorios. Total: 52 testes.

## Variaveis de ambiente

Ver `.env.example`. Para Sprint 3 e necessario `GEMINI_API_KEY` (gratuita em https://aistudio.google.com/apikey).

## Estrutura do Projeto

```
StudyAI/
|
|- src/ (backend)
|  |- controllers
|  |- services
|  |- repositories
|  |- routes
|  |- dtos
|  |- config
|  |- __tests__
|
|- frontend/
|  |- src/
|     |- pages/
|     |- services/
|     |- contexts/
|     |- router/
|
|- docker-compose.yml
|- Dockerfile
|- README.md
```

## Status do Projeto

- Sprint 1 - Planejamento (concluida)
- Sprint 2 - Base funcional (MVP) (concluida)
- Sprint 3 - Integracao com IA (concluida)
- Sprint 4 - Estudo ativo: respostas, desempenho, tarefas, telas dedicadas (concluida)

## Autores

- Felipe Ramalho Perdigao
- Liam Coifman Rodrigues
