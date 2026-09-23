const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { env } = require('../config/env');

function tokenDeTeste() {
  return jwt.sign({ email: 'teste@studyai.com' }, env.jwtSecret, { subject: '1', expiresIn: '5m' });
}

describe('app', () => {
  it('responde 400 quando o corpo da requisicao esta ausente', async () => {
    const response = await request(app).post('/api/v1/auth/register');

    expect(response.status).toBe(400);
  });

  it('responde 404 para rota inexistente', async () => {
    const response = await request(app).get('/api/v1/rota-inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Route not found' });
  });

  it('exige autenticacao no caderno de erros', async () => {
    const response = await request(app).get('/api/v1/caderno-erros');

    expect(response.status).toBe(401);
  });

  it('exige autenticacao no painel de orientacao', async () => {
    const response = await request(app).get('/api/v1/painel');

    expect(response.status).toBe(401);
  });

  it('valida a sessao de questoes antes de consultar o banco', async () => {
    const semConteudo = await request(app)
      .get('/api/v1/plano-estudo/sessao')
      .set('Authorization', `Bearer ${tokenDeTeste()}`);

    expect(semConteudo.status).toBe(400);
    expect(semConteudo.body.message).toContain('conteudo_id');

    const quantidadeInvalida = await request(app)
      .get('/api/v1/plano-estudo/sessao?conteudo_id=1&quantidade=99')
      .set('Authorization', `Bearer ${tokenDeTeste()}`);

    expect(quantidadeInvalida.status).toBe(400);
    expect(quantidadeInvalida.body.message).toContain('quantidade');
  });

  it('valida o tipo da atividade de estudo', async () => {
    const response = await request(app)
      .post('/api/v1/atividades')
      .set('Authorization', `Bearer ${tokenDeTeste()}`)
      .send({ conteudo_id: 1, tipo: 'simulado' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('tipo must be one of');
  });

  it('valida os filtros do caderno de erros antes de consultar o banco', async () => {
    const response = await request(app)
      .get('/api/v1/caderno-erros?status=arquivado')
      .set('Authorization', `Bearer ${tokenDeTeste()}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('status must be one of');
  });
});
