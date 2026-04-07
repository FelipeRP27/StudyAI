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
