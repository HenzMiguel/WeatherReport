import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  createAuthService,
  parseAdministrators,
} from '../src/services/auth.js';

const logger = { info() {}, error() {} };
const auth = createAuthService({
  administrators: parseAdministrators(
    'admin@example.com:correct-horse\nsecond@example.com:another-password',
  ),
  secret: 'test-secret',
});
const app = createApp({ auth }, logger);
test('admin session requires a valid administrator token', async () => {
  await request(app).get('/api/v1/admin/sessao').expect(401);
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@example.com', senha: 'correct-horse' })
    .expect(200);
  assert.equal(login.body.papel, 'ADMIN');
  await request(app)
    .get('/api/v1/admin/sessao')
    .set('Authorization', 'Bearer ' + login.body.token_acesso)
    .expect(200)
    .expect(({ body }) =>
      assert.deepEqual(body, { email: 'admin@example.com', papel: 'ADMIN' }),
    );
});
test('administrators file rejects malformed entries', () => {
  assert.throws(() => parseAdministrators('invalid-line'), /linha 1/);
  assert.throws(
    () => parseAdministrators('admin@example.com:a\nadmin@example.com:b'),
    /linha 2/,
  );
});
test('wrong credentials and tampered sessions are rejected', async () => {
  await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@example.com', senha: 'wrong' })
    .expect(401);
  await request(app)
    .get('/api/v1/admin/sessao')
    .set('Authorization', 'Bearer invalid.token.value')
    .expect(401);
});
