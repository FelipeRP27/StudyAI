CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_materias_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conteudos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    texto TEXT NOT NULL,
    materia_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conteudos_materia
        FOREIGN KEY (materia_id)
        REFERENCES materias (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_conteudos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resumos (
    id SERIAL PRIMARY KEY,
    conteudo_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resumos_conteudo
        FOREIGN KEY (conteudo_id)
        REFERENCES conteudos (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pontos_chave (
    id SERIAL PRIMARY KEY,
    conteudo_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pontos_chave_conteudo
        FOREIGN KEY (conteudo_id)
        REFERENCES conteudos (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questoes (
    id SERIAL PRIMARY KEY,
    conteudo_id INTEGER NOT NULL,
    enunciado TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_questoes_conteudo
        FOREIGN KEY (conteudo_id)
        REFERENCES conteudos (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alternativas (
    id SERIAL PRIMARY KEY,
    questao_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    is_correta BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alternativas_questao
        FOREIGN KEY (questao_id)
        REFERENCES questoes (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,
    conteudo_id INTEGER NOT NULL,
    frente TEXT NOT NULL,
    verso TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_flashcards_conteudo
        FOREIGN KEY (conteudo_id)
        REFERENCES conteudos (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS processamentos (
    id SERIAL PRIMARY KEY,
    conteudo_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    erro TEXT,
    iniciado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluido_em TIMESTAMP,
    CONSTRAINT fk_processamentos_conteudo
        FOREIGN KEY (conteudo_id)
        REFERENCES conteudos (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_processamentos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE,
    CONSTRAINT chk_processamentos_tipo
        CHECK (tipo IN ('resumo', 'pontos_chave', 'questoes', 'flashcards', 'completo')),
    CONSTRAINT chk_processamentos_status
        CHECK (status IN ('pendente', 'processando', 'concluido', 'erro'))
);

CREATE TABLE IF NOT EXISTS respostas_questoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    questao_id INTEGER NOT NULL,
    alternativa_id INTEGER NOT NULL,
    is_correta BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_respostas_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_respostas_questao
        FOREIGN KEY (questao_id)
        REFERENCES questoes (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_respostas_alternativa
        FOREIGN KEY (alternativa_id)
        REFERENCES alternativas (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcards_revisados (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    flashcard_id INTEGER NOT NULL,
    revisado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_flashcards_revisados_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_flashcards_revisados_flashcard
        FOREIGN KEY (flashcard_id)
        REFERENCES flashcards (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_flashcards_revisados_user_card
        UNIQUE (usuario_id, flashcard_id)
);

CREATE TABLE IF NOT EXISTS tarefas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    materia_id INTEGER,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    data_limite DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluida_em TIMESTAMP,
    CONSTRAINT fk_tarefas_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tarefas_materia
        FOREIGN KEY (materia_id)
        REFERENCES materias (id)
        ON DELETE SET NULL,
    CONSTRAINT chk_tarefas_status
        CHECK (status IN ('pendente', 'concluida'))
);

CREATE INDEX IF NOT EXISTS idx_materias_usuario_id ON materias (usuario_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_materia_id ON conteudos (materia_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_usuario_id ON conteudos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_resumos_conteudo_id ON resumos (conteudo_id);
CREATE INDEX IF NOT EXISTS idx_pontos_chave_conteudo_id ON pontos_chave (conteudo_id);
CREATE INDEX IF NOT EXISTS idx_questoes_conteudo_id ON questoes (conteudo_id);
CREATE INDEX IF NOT EXISTS idx_alternativas_questao_id ON alternativas (questao_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_conteudo_id ON flashcards (conteudo_id);
CREATE INDEX IF NOT EXISTS idx_processamentos_conteudo_id ON processamentos (conteudo_id);
CREATE INDEX IF NOT EXISTS idx_processamentos_usuario_id ON processamentos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_processamentos_status ON processamentos (status);
CREATE INDEX IF NOT EXISTS idx_respostas_usuario_id ON respostas_questoes (usuario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_questao_id ON respostas_questoes (questao_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_revisados_usuario_id ON flashcards_revisados (usuario_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_revisados_flashcard_id ON flashcards_revisados (flashcard_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON tarefas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_materia_id ON tarefas (materia_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_limite ON tarefas (data_limite);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas (status);

CREATE TABLE IF NOT EXISTS ia_cache (
    hash CHAR(64) PRIMARY KEY,
    modelo VARCHAR(60) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ia_cache_created_at ON ia_cache (created_at);

ALTER TABLE alternativas ADD COLUMN IF NOT EXISTS justificativa TEXT;
