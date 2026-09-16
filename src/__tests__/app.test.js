const request = require('supertest');
const app = require('../app');

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
});
