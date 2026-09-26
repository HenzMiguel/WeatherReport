import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createApp } from '../src/app.js';
import { createForecastService } from '../src/services/forecast.js';
import { createHistoryRepository } from '../src/repositories/history.js';
import { cityId } from '../src/repositories/cities.js';
import { unavailable } from '../src/services/errors.js';
const city = {
  id: cityId(4204202),
  codigo_ibge: '4204202',
  nome: 'Chapecó',
  uf: 'SC',
  latitude: -27.1,
  longitude: -52.6,
  fuso_horario: 'America/Sao_Paulo',
  nivel_risco: null,
};
const logger = { info() {}, warn() {}, error() {} };
const contract = await SwaggerParser.dereference('SDD/swagger.yaml');
const ajv = addFormats(new Ajv({ strict: false }));
function assertSchema(name, body) {
  const check = ajv.compile(contract.components.schemas[name]);
  assert.ok(check(body), JSON.stringify(check.errors));
}
function sample() {
  const hour = Math.floor(Date.now() / 3600000) * 3600;
  const times = Array.from({ length: 216 }, (_, i) => hour - (215 - i) * 3600);
  return {
    current: { time: hour, temperature_2m: 25 },
    hourly: { time: times, temperature_2m: times.map(() => 22) },
  };
}
function setup(options = {}) {
  const forecast = createForecastService({
    requestJson: async () => sample(),
    alerts: async () => ({ level: 'NORMAL', alerts: [] }),
    history: { read: async () => null, save: async () => {} },
    logger,
    ...options,
  });
  return {
    forecast,
    app: createApp(
      {
        cities: { find: (id) => (id === city.id ? city : undefined) },
        forecast,
      },
      logger,
    ),
  };
}
test('full forecast HTTP response conforms to OpenAPI and keeps city identity', async () => {
  const { app } = setup();
  const result = await request(app)
    .get('/api/v1/cidades/' + city.id + '/previsao')
    .expect(200);
  assertSchema('DetalhePrevisaoCidade', result.body);
  assert.equal(result.body.nome, 'Chapecó');
  assert.equal(result.body.historico_24h.length, 24);
  assert.equal(result.body.grafico_semanal.length, 8);
});
test('alert outage is explicit partial data, never fabricated normal risk', async () => {
  const { app } = setup({
    alerts: async () => {
      throw unavailable();
    },
  });
  const result = await request(app)
    .get('/api/v1/cidades/' + city.id + '/previsao')
    .expect(200);
  assertSchema('DetalhePrevisaoCidade', result.body);
  assert.equal(result.body.nivel_risco_semana, null);
  assert.ok(result.body.avisos.some((w) => w.includes('alertas')));
  assert.equal(result.body.temperatura_hoje, 25);
});
test('weather outage, missing city, and unexpected failure use standardized errors', async () => {
  let { app } = setup({
    requestJson: async () => {
      throw unavailable();
    },
  });
  let result = await request(app)
    .get('/api/v1/cidades/' + city.id + '/previsao')
    .expect(503);
  assertSchema('ErroPadronizado', result.body);
  result = await request(app)
    .get('/api/v1/cidades/' + cityId(1234567) + '/previsao')
    .expect(404);
  assertSchema('ErroPadronizado', result.body);
  app = createApp(
    {
      cities: {
        search: async () => {
          throw new Error('private error');
        },
      },
    },
    logger,
  );
  result = await request(app).get('/api/v1/cidades?uf=SC').expect(500);
  assertSchema('ErroPadronizado', result.body);
  assert.ok(!JSON.stringify(result.body).includes('private error'));
});
test('cache coalesces concurrent weather requests and persists JSON', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weatherreport-test-'));
  try {
    const history = createHistoryRepository(directory);
    let calls = 0;
    const { forecast } = setup({
      history,
      requestJson: async () => {
        calls++;
        return sample();
      },
    });
    const [first, second] = await Promise.all([
      forecast(city, 'a'),
      forecast(city, 'b'),
    ]);
    assert.deepEqual(first, second);
    assert.equal(calls, 1);
    const saved = await history.read(city.id);
    assert.equal(saved.data.cidade_id, city.id);
    const restarted = setup({
      history,
      requestJson: async () => {
        throw new Error('must use valid persistence');
      },
    });
    assert.deepEqual(await restarted.forecast(city, 'c'), first);
    saved.expires = Date.now() - 1;
    await history.save(city.id, saved);
    const refreshed = setup({
      history,
      requestJson: async () => {
        calls++;
        return sample();
      },
    });
    await refreshed.forecast(city, 'd');
    assert.equal(calls, 2);
  } finally {
    assert.ok(directory.startsWith(join(tmpdir(), 'weatherreport-test-')));
    await rm(directory, { recursive: true, force: true });
  }
});
