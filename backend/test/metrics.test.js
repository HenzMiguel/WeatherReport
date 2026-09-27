import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  createAuthService,
  parseAdministrators,
} from '../src/services/auth.js';
import { createMetricsService } from '../src/services/metrics.js';
test('admin metrics are protected and report a readable one-hour request series', async () => {
  let time = Date.parse('2026-09-27T12:00:00.000Z');
  let cpu = { user: 1_000, system: 1_000 };
  const metrics = createMetricsService({
    now: () => time,
    cpuUsage: () => cpu,
    memoryUsage: () => ({ rss: 200 * 1024 * 1024 }),
    cpuCount: () => 1,
  });
  const auth = createAuthService({
    administrators: parseAdministrators('admin@example.com:secret'),
    secret: 'test-secret',
  });
  const app = createApp({ auth, metrics }, { info() {}, error() {} });
  await request(app).get('/api/v1/admin/metricas').expect(401);
  time += 60_000;
  cpu = { user: 30_001_000, system: 1_000 };
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@example.com', senha: 'secret' });
  const response = await request(app)
    .get('/api/v1/admin/metricas')
    .set('Authorization', 'Bearer ' + login.body.token_acesso)
    .expect(200);
  assert.equal(response.body.periodo.intervalo_segundos, 60);
  assert.equal(response.body.requisicoes_por_intervalo.length, 60);
  assert.equal(response.body.total_erros, 1);
  assert.equal(response.body.consumo_memoria_mb, 200);
  assert.equal(response.body.uso_cpu_porcentagem, 50);
});
