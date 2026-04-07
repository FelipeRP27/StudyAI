📚 StudyAI

Assistente Inteligente para Concursos Públicos

🚀 Sobre o Projeto

O StudyAI é uma plataforma desenvolvida para auxiliar estudantes de concursos públicos a transformar conteúdos teóricos em materiais de estudo ativos.

O sistema permite organizar conteúdos, criar materiais de estudo e acompanhar o aprendizado de forma estruturada.

🎯 Objetivo

Facilitar o processo de estudo através de:

Organização por matérias
Estruturação de conteúdos
Criação de materiais como:
Resumos
Questões
Flashcards
🧠 Funcionalidades
🔐 Autenticação
Cadastro de usuário
Login com JWT
Rotas protegidas
📚 Matérias
Criar, editar e excluir matérias
Listagem por usuário
📝 Conteúdos
Inserção de conteúdo teórico
Associação com matérias
🧩 Estrutura de Estudo
Resumos
Pontos-chave
Questões (com alternativas)
Flashcards
📊 Dashboard
Visualização das matérias cadastradas
🏗️ Arquitetura

O projeto segue uma arquitetura em camadas:

Controller → Entrada de dados (requisições)
Service → Regras de negócio
Repository → Acesso ao banco de dados
DTOs → Padronização de dados
🛠️ Tecnologias Utilizadas
Backend
Node.js
Express
PostgreSQL
JWT (Autenticação)
bcrypt (Criptografia de senha)
Frontend
React
Vite
React Router
🔗 Integração

Fluxo do sistema:

Usuário → Frontend → Backend → Banco de Dados → Backend → Frontend

⚙️ Como rodar o projeto
🔹 Backend
npm install
npm run dev
🔹 Frontend
cd frontend
npm install
npm run dev

📦 Estrutura do Projeto
StudyAI/
│
├── src/ (backend)
│   ├── controllers
│   ├── services
│   ├── repositories
│   ├── routes
│   └── config
│
├── frontend/
│   ├── src/
│   ├── pages/
│   ├── services/
│   └── contexts/
│
└── README.md
📌 Status do Projeto

✔ Sprint 1 – Planejamento
✔ Sprint 2 – Base funcional (MVP)
🚧 Sprint 3 – Integração com IA (em andamento)

👨‍💻 Autores

Felipe Ramalho Perdigão
Liam Coifman Rodrigues

