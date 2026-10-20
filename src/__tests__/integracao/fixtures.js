const db = require('../../config/database');

const TABELAS = [
  'atividades_estudo',
  'respostas_questoes',
  'flashcards_revisados',
  'alternativas',
  'questoes',
  'flashcards',
  'pontos_chave',
  'resumos',
  'processamentos',
  'tarefas',
  'conteudos',
  'materias',
  'usuarios',
  'ia_cache'
];

async function limparBanco() {
  await db.query(`TRUNCATE ${TABELAS.join(', ')} RESTART IDENTITY CASCADE`);
}

async function criarUsuario(nome = 'Aluno de teste') {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, 'hash') RETURNING id`,
    [nome, `teste.${Date.now()}.${Math.random().toString(16).slice(2)}@studyai.test`]
  );
  return rows[0].id;
}

async function criarMateria(usuarioId, nome = 'Direito Administrativo') {
  const { rows } = await db.query(
    'INSERT INTO materias (usuario_id, nome) VALUES ($1, $2) RETURNING id',
    [usuarioId, nome]
  );
  return rows[0].id;
}

async function criarConteudo(usuarioId, materiaId, titulo = 'Atos Administrativos') {
  const { rows } = await db.query(
    `INSERT INTO conteudos (titulo, texto, materia_id, usuario_id)
     VALUES ($1, 'texto do conteudo usado nos testes de integracao', $2, $3) RETURNING id`,
    [titulo, materiaId, usuarioId]
  );
  return rows[0].id;
}

async function criarQuestao(conteudoId, { enunciado = 'Enunciado de teste', assunto = null } = {}) {
  const { rows } = await db.query(
    'INSERT INTO questoes (conteudo_id, enunciado, assunto) VALUES ($1, $2, $3) RETURNING id',
    [conteudoId, enunciado, assunto]
  );
  const questaoId = rows[0].id;

  const alternativas = await db.query(
    `INSERT INTO alternativas (questao_id, texto, is_correta)
     VALUES ($1, 'correta', TRUE), ($1, 'errada', FALSE)
     RETURNING id, is_correta`,
    [questaoId]
  );

  return {
    id: questaoId,
    correta: alternativas.rows.find((alt) => alt.is_correta).id,
    errada: alternativas.rows.find((alt) => !alt.is_correta).id
  };
}

async function responder(usuarioId, questao, acertou, { diasAtras = 0, horas = 12 } = {}) {
  const { rows } = await db.query(
    `INSERT INTO respostas_questoes (usuario_id, questao_id, alternativa_id, is_correta, created_at)
     VALUES ($1, $2, $3, $4, DATE_TRUNC('day', NOW()) - ($5 || ' days')::interval + ($6 || ' hours')::interval)
     RETURNING id, created_at`,
    [usuarioId, questao.id, acertou ? questao.correta : questao.errada, acertou, diasAtras, horas]
  );
  return rows[0];
}

module.exports = {
  limparBanco,
  criarUsuario,
  criarMateria,
  criarConteudo,
  criarQuestao,
  responder
};
