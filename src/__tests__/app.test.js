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

  it('valida os filtros do caderno de erros antes de consultar o banco', async () => {
    const response = await request(app)
      .get('/api/v1/caderno-erros?status=arquivado')
      .set('Authorization', `Bearer ${tokenDeTeste()}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('status must be one of');
  });
});
