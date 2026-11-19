jest.mock('../../services/iaService');

const request = require('supertest');
const app = require('../../app');
const db = require('../../config/database');
const { limparBanco } = require('./fixtures');

const API = '/api/v1';
const SENHA = 'segredo123';

const codigos = [];

function registrar(rota, metodo, status) {
  codigos.push({ rota, metodo, status });
}

async function criarUsuario(nome, email) {
  await request(app).post(`${API}/auth/register`).send({ nome, email, senha: SENHA });
  const login = await request(app).post(`${API}/auth/login`).send({ email, senha: SENHA });
  return { id: login.body.usuario.id, token: login.body.token, resposta: login };
}

// executa a tentativa do invasor e exige que a API negue
async function negar(metodo, rota, token, corpo) {
  const req = request(app)[metodo](`${API}${rota}`).set('Authorization', `Bearer ${token}`);
  const resposta = corpo ? await req.send(corpo) : await req;

  registrar(rota, metodo.toUpperCase(), resposta.status);

  expect([403, 404]).toContain(resposta.status);
  return resposta;
}

function contemSegredo(valor) {
  const texto = JSON.stringify(valor || {});
  return /"senha"|"password"|\$2[aby]\$/.test(texto);
}

describe('isolamento de dados entre usuarios (banco real)', () => {
  let alice;
  let bob;
  let recursosDeAlice;
  const respostasObservadas = [];

  beforeAll(async () => {
    await limparBanco();

    alice = await criarUsuario('Alice Alpha', 'alice@studyai.test');
    bob = await criarUsuario('Bob Beta', 'bob@studyai.test');
    respostasObservadas.push(alice.resposta.body, bob.resposta.body);

    const comoAlice = (metodo, rota) =>
      request(app)[metodo](`${API}${rota}`).set('Authorization', `Bearer ${alice.token}`);

    const materia = await comoAlice('post', '/materias').send({
      nome: 'Direito Administrativo',
      descricao: 'Material privado de Alice'
    });

    const conteudo = await comoAlice('post', '/conteudos').send({
      titulo: 'Atos administrativos de Alice',
      texto: 'Texto teorico privado de Alice usado apenas nos testes de isolamento entre usuarios.',
      materia_id: materia.body.id
    });

    const questao = await comoAlice('post', '/questoes').send({
      conteudo_id: conteudo.body.id,
      enunciado: 'Qual atributo permite a execucao direta do ato?',
      assunto: 'Atributos',
      alternativas: [
        { texto: 'Autoexecutoriedade', is_correta: true, justificativa: 'Correta' },
        { texto: 'Tipicidade', is_correta: false, justificativa: 'Incorreta' }
      ]
    });

    const questoes = await comoAlice('get', `/questoes/conteudo/${conteudo.body.id}`);
    const alternativas = questoes.body[0].alternativas;

    await comoAlice('post', '/respostas').send({
      questao_id: questao.body.id,
      alternativa_id: alternativas.find((a) => !a.is_correta).id
    });

    const flashcard = await comoAlice('post', '/flashcards').send({
      conteudo_id: conteudo.body.id,
      frente: 'Frente privada de Alice',
      verso: 'Verso privado de Alice'
    });

    const tarefa = await comoAlice('post', '/tarefas').send({
      titulo: 'Tarefa privada de Alice',
      descricao: 'Nao deve aparecer para Bob',
      data_limite: '2027-01-30',
      materia_id: materia.body.id
    });

    await comoAlice('post', '/resumos').send({
      conteudo_id: conteudo.body.id,
      texto: 'Resumo privado de Alice com conteudo suficiente para passar na validacao.'
    });

    await comoAlice('post', '/pontos-chave').send({
      conteudo_id: conteudo.body.id,
      texto: 'Ponto-chave privado de Alice'
    });

    recursosDeAlice = {
      materiaId: materia.body.id,
      conteudoId: conteudo.body.id,
      questaoId: questao.body.id,
      alternativaId: alternativas[0].id,
      flashcardId: flashcard.body.id,
      tarefaId: tarefa.body.id
    };
  });

  afterAll(async () => {
    const tabela = codigos
      .map((c) => `${c.metodo.padEnd(6)} ${c.rota.padEnd(46)} -> ${c.status}`)
      .join('\n');
    console.log('\nCodigos retornados ao usuario invasor:\n' + tabela);
    await db.pool.end();
  });

  describe('Bob tentando LER recursos de Alice', () => {
    test('conteudo por id', async () => {
      await negar('get', `/conteudos/${recursosDeAlice.conteudoId}`, bob.token);
    });

    test('conteudos de uma materia alheia', async () => {
      await negar('get', `/conteudos/materia/${recursosDeAlice.materiaId}`, bob.token);
    });

    test('questoes de um conteudo alheio', async () => {
      await negar('get', `/questoes/conteudo/${recursosDeAlice.conteudoId}`, bob.token);
    });

    test('resumos de um conteudo alheio', async () => {
      await negar('get', `/resumos/conteudo/${recursosDeAlice.conteudoId}`, bob.token);
    });

    test('pontos-chave de um conteudo alheio', async () => {
      await negar('get', `/pontos-chave/conteudo/${recursosDeAlice.conteudoId}`, bob.token);
    });

    test('flashcards de um conteudo alheio', async () => {
      await negar('get', `/flashcards/conteudo/${recursosDeAlice.conteudoId}`, bob.token);
    });

    test('processamentos de um conteudo alheio', async () => {
      await negar('get', `/processamentos/conteudo/${recursosDeAlice.conteudoId}`, bob.token);
    });

    test('alternativas de uma questao alheia', async () => {
      await negar('get', `/alternativas/questao/${recursosDeAlice.questaoId}`, bob.token);
    });

    test('respostas de uma questao alheia', async () => {
      await negar('get', `/respostas/questao/${recursosDeAlice.questaoId}`, bob.token);
    });

    test('desempenho de uma materia alheia', async () => {
      await negar('get', `/desempenho/materias/${recursosDeAlice.materiaId}`, bob.token);
    });

    test('sessao de estudo sobre conteudo alheio', async () => {
      await negar(
        'get',
        `/plano-estudo/sessao?conteudo_id=${recursosDeAlice.conteudoId}`,
        bob.token
      );
    });
  });

  describe('Bob tentando ALTERAR recursos de Alice', () => {
    test('editar materia alheia', async () => {
      await negar('put', `/materias/${recursosDeAlice.materiaId}`, bob.token, {
        nome: 'Invadido por Bob',
        descricao: 'Invadido'
      });
    });

    test('editar conteudo alheio', async () => {
      await negar('put', `/conteudos/${recursosDeAlice.conteudoId}`, bob.token, {
        titulo: 'Invadido por Bob',
        texto: 'Texto invasor com tamanho suficiente para passar pela validacao do DTO.'
      });
    });

    test('editar tarefa alheia', async () => {
      await negar('put', `/tarefas/${recursosDeAlice.tarefaId}`, bob.token, {
        titulo: 'Tarefa invadida',
        descricao: 'Invadida',
        data_limite: '2027-02-01'
      });
    });

    test('alterar status de tarefa alheia', async () => {
      await negar('patch', `/tarefas/${recursosDeAlice.tarefaId}/status`, bob.token, {
        status: 'concluida'
      });
    });

    test('marcar flashcard alheio como revisado', async () => {
      await negar('post', `/flashcards/${recursosDeAlice.flashcardId}/revisado`, bob.token);
    });

    test('desmarcar flashcard alheio', async () => {
      await negar('delete', `/flashcards/${recursosDeAlice.flashcardId}/revisado`, bob.token);
    });

    test('gerar material com IA em conteudo alheio', async () => {
      await negar('post', `/processamentos/conteudo/${recursosDeAlice.conteudoId}`, bob.token, {
        tipos: ['resumo']
      });
    });
  });

  describe('Bob tentando EXCLUIR recursos de Alice', () => {
    test('excluir conteudo alheio', async () => {
      await negar('delete', `/conteudos/${recursosDeAlice.conteudoId}`, bob.token);
    });

    test('excluir tarefa alheia', async () => {
      await negar('delete', `/tarefas/${recursosDeAlice.tarefaId}`, bob.token);
    });

    test('excluir materia alheia', async () => {
      await negar('delete', `/materias/${recursosDeAlice.materiaId}`, bob.token);
    });
  });

  describe('Bob tentando CRIAR recursos pendurados nos de Alice', () => {
    test('conteudo dentro de materia alheia', async () => {
      await negar('post', '/conteudos', bob.token, {
        titulo: 'Conteudo do invasor',
        texto: 'Texto do invasor com tamanho suficiente para passar pela validacao do DTO.',
        materia_id: recursosDeAlice.materiaId
      });
    });

    test('questao em conteudo alheio', async () => {
      await negar('post', '/questoes', bob.token, {
        conteudo_id: recursosDeAlice.conteudoId,
        enunciado: 'Questao do invasor com enunciado suficientemente longo',
        alternativas: [
          { texto: 'A', is_correta: true },
          { texto: 'B', is_correta: false }
        ]
      });
    });

    test('resumo em conteudo alheio', async () => {
      await negar('post', '/resumos', bob.token, {
        conteudo_id: recursosDeAlice.conteudoId,
        texto: 'Resumo do invasor com tamanho suficiente para passar pela validacao.'
      });
    });

    test('ponto-chave em conteudo alheio', async () => {
      await negar('post', '/pontos-chave', bob.token, {
        conteudo_id: recursosDeAlice.conteudoId,
        texto: 'Ponto-chave do invasor'
      });
    });

    test('flashcard em conteudo alheio', async () => {
      await negar('post', '/flashcards', bob.token, {
        conteudo_id: recursosDeAlice.conteudoId,
        frente: 'Frente do invasor',
        verso: 'Verso do invasor'
      });
    });

    test('alternativa em questao alheia', async () => {
      await negar('post', '/alternativas', bob.token, {
        questao_id: recursosDeAlice.questaoId,
        texto: 'Alternativa do invasor',
        is_correta: false
      });
    });

    test('resposta a questao alheia', async () => {
      await negar('post', '/respostas', bob.token, {
        questao_id: recursosDeAlice.questaoId,
        alternativa_id: recursosDeAlice.alternativaId
      });
    });

    test('registro de estudo em conteudo alheio', async () => {
      await negar('post', '/atividades', bob.token, {
        conteudo_id: recursosDeAlice.conteudoId,
        tipo: 'resumo'
      });
    });

    test('tarefa vinculada a materia alheia', async () => {
      await negar('post', '/tarefas', bob.token, {
        titulo: 'Tarefa do invasor',
        descricao: 'Vinculada a materia de outro usuario',
        data_limite: '2027-03-01',
        materia_id: recursosDeAlice.materiaId
      });
    });
  });

  describe('listagens e analises de Bob nao contem dados de Alice', () => {
    const rotasDeLeitura = [
      '/materias',
      '/tarefas',
      '/plano-estudo',
      '/plano-estudo/diagnostico',
      '/painel',
      '/desempenho',
      '/proximo-passo',
      '/caderno-erros',
      '/caderno-erros/resumo'
    ];

    test.each(rotasDeLeitura)('%s nao vaza nada de Alice', async (rota) => {
      const resposta = await request(app)
        .get(`${API}${rota}`)
        .set('Authorization', `Bearer ${bob.token}`);

      registrar(rota, 'GET', resposta.status);
      expect(resposta.status).toBe(200);
      respostasObservadas.push(resposta.body);

      const corpo = JSON.stringify(resposta.body);
      expect(corpo).not.toContain('Alice');
      expect(corpo).not.toContain('Atos administrativos de Alice');
      expect(corpo).not.toContain(`"conteudo_id":${recursosDeAlice.conteudoId}`);
      expect(corpo).not.toContain(`"materia_id":${recursosDeAlice.materiaId}`);
    });

    test('filtros do caderno de erros com ids de Alice nao trazem dados dela', async () => {
      const resposta = await request(app)
        .get(
          `${API}/caderno-erros?materia_id=${recursosDeAlice.materiaId}&conteudo_id=${recursosDeAlice.conteudoId}`
        )
        .set('Authorization', `Bearer ${bob.token}`);

      registrar('/caderno-erros?materia_id=&conteudo_id=', 'GET', resposta.status);
      respostasObservadas.push(resposta.body);

      if (resposta.status === 200) {
        expect(resposta.body.itens || []).toHaveLength(0);
      } else {
        expect([403, 404]).toContain(resposta.status);
      }
    });
  });

  describe('autenticacao', () => {
    const protegidas = [
      ['get', '/materias'],
      ['get', '/plano-estudo'],
      ['get', '/painel'],
      ['get', '/proximo-passo'],
      ['get', '/caderno-erros'],
      ['get', '/desempenho'],
      ['get', '/tarefas'],
      ['get', '/protected/status']
    ];

    test.each(protegidas)('%s %s exige token', async (metodo, rota) => {
      const semToken = await request(app)[metodo](`${API}${rota}`);
      expect(semToken.status).toBe(401);
    });

    test('token invalido e recusado', async () => {
      const resposta = await request(app)
        .get(`${API}/materias`)
        .set('Authorization', 'Bearer token-forjado');

      expect(resposta.status).toBe(401);
    });

    test('token assinado com outro segredo e recusado', async () => {
      const jwt = require('jsonwebtoken');
      const forjado = jwt.sign({ email: 'alice@studyai.test' }, 'segredo-errado', {
        subject: String(alice.id),
        expiresIn: '5m'
      });

      const resposta = await request(app)
        .get(`${API}/materias`)
        .set('Authorization', `Bearer ${forjado}`);

      expect(resposta.status).toBe(401);
    });
  });

  describe('integridade dos dados de Alice apos as tentativas', () => {
    test('nada foi apagado nem alterado no banco', async () => {
      const { rows } = await db.query(
        `SELECT
           (SELECT COUNT(*)::int FROM materias WHERE usuario_id = $1) AS materias,
           (SELECT COUNT(*)::int FROM conteudos WHERE usuario_id = $1) AS conteudos,
           (SELECT COUNT(*)::int FROM tarefas WHERE usuario_id = $1) AS tarefas,
           (SELECT COUNT(*)::int FROM respostas_questoes WHERE usuario_id = $1) AS respostas,
           (SELECT COUNT(*)::int FROM questoes q
              INNER JOIN conteudos c ON c.id = q.conteudo_id WHERE c.usuario_id = $1) AS questoes,
           (SELECT COUNT(*)::int FROM flashcards f
              INNER JOIN conteudos c ON c.id = f.conteudo_id WHERE c.usuario_id = $1) AS flashcards,
           (SELECT titulo FROM conteudos WHERE id = $2) AS titulo_conteudo,
           (SELECT nome FROM materias WHERE id = $3) AS nome_materia,
           (SELECT status FROM tarefas WHERE id = $4) AS status_tarefa`,
        [alice.id, recursosDeAlice.conteudoId, recursosDeAlice.materiaId, recursosDeAlice.tarefaId]
      );

      expect(rows[0]).toEqual(
        expect.objectContaining({
          materias: 1,
          conteudos: 1,
          tarefas: 1,
          respostas: 1,
          questoes: 1,
          flashcards: 1,
          titulo_conteudo: 'Atos administrativos de Alice',
          nome_materia: 'Direito Administrativo'
        })
      );
      expect(rows[0].status_tarefa).not.toBe('concluida');
    });

    test('Bob nao criou nada pendurado nos recursos de Alice', async () => {
      const { rows } = await db.query(
        `SELECT
           (SELECT COUNT(*)::int FROM conteudos WHERE usuario_id = $1) AS conteudos_de_bob,
           (SELECT COUNT(*)::int FROM tarefas WHERE usuario_id = $1) AS tarefas_de_bob,
           (SELECT COUNT(*)::int FROM respostas_questoes WHERE usuario_id = $1) AS respostas_de_bob,
           (SELECT COUNT(*)::int FROM atividades_estudo WHERE usuario_id = $1) AS atividades_de_bob,
           (SELECT COUNT(*)::int FROM flashcards_revisados WHERE usuario_id = $1) AS revisoes_de_bob`,
        [bob.id]
      );

      expect(rows[0]).toEqual({
        conteudos_de_bob: 0,
        tarefas_de_bob: 0,
        respostas_de_bob: 0,
        atividades_de_bob: 0,
        revisoes_de_bob: 0
      });
    });
  });

  describe('credenciais', () => {
    test('nenhuma resposta observada expoe senha ou hash', () => {
      const vazando = respostasObservadas.filter(contemSegredo);
      expect(vazando).toEqual([]);
    });

    test('o cadastro e o login nao devolvem o campo senha', async () => {
      const cadastro = await request(app)
        .post(`${API}/auth/register`)
        .send({ nome: 'Carol', email: 'carol@studyai.test', senha: SENHA });

      expect(contemSegredo(cadastro.body)).toBe(false);
      expect(cadastro.body.usuario?.senha).toBeUndefined();
    });
  });
});
