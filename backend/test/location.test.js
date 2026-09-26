import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createApp } from '../src/app.js';
import { createCityRepository, cityId } from '../src/repositories/cities.js';
import { createLocationService } from '../src/services/location.js';
import { createHttpClient } from '../src/services/http.js';
const logger = { info() {}, warn() {}, error() {} };
const rows = [
  {
    nome: 'Chapecó',
    uf: 'SC',
    ibge: 4204202,
    latitude: -27.1,
    longitude: -52.6,
    fuso: 'America/Sao_Paulo',
  },
  {
    nome: 'Águas de Chapecó',
    uf: 'SC',
    ibge: 4200507,
    latitude: -27.07,
    longitude: -52.98,
    fuso: 'America/Sao_Paulo',
  },
];
const document = await SwaggerParser.dereference('SDD/swagger.yaml');
const ajv = addFormats(new Ajv({ strict: false }));
function conforms(schema, body) {
  const validate = ajv.compile(document.components.schemas[schema]);
  assert.ok(validate(body), JSON.stringify(validate.errors));
}
function setup(json = async () => ({ cidades: rows })) {
  const cities = createCityRepository(json);
  const locate = createLocationService(json, cities);
  return createApp({ cities, locate }, logger);
}
test('non-capital search normalizes accents, paginates and preserves UUIDs', async () => {
  const app = setup();
  const result = await request(app)
    .get('/api/v1/cidades?nome=CHAPECO&uf=sc&limit=1&page=2')
    .expect(200);
  conforms('ListaCidades', result.body);
  assert.equal(result.body.dados[0].nome, 'Chapecó');
  assert.equal(result.body.dados[0].id, cityId(4204202));
  assert.equal(result.body.paginacao.total_itens, 2);
  assert.equal(result.body.dados[0].nivel_risco, null);
});
test('empty search returns empty data rather than fabricated cities', async () => {
  const result = await request(setup())
    .get('/api/v1/cidades?nome=inexistente')
    .expect(200);
  assert.deepEqual(result.body.dados, []);
});
test('invalid queries use contract 400 and correlation ID', async () => {
  const app = setup();
  for (const path of [
    '/cidades',
    '/cidades?uf=ZZ',
    '/cidades?nome=&uf=SC',
    '/cidades?nome=Chapeco&uf=',
    '/cidades?nome=a',
    '/cidades?uf=SC&page=0',
    '/cidades?uf=SC&limit=51',
    '/cidades?uf=SC&nome=a&nome=b',
    '/localizacoes?latitude=91&longitude=0',
    '/localizacoes?latitude=&longitude=0',
    '/cidades/no-uuid/previsao',
  ]) {
    const result = await request(app)
      .get('/api/v1' + path)
      .expect(400);
    conforms('ErroPadronizado', result.body);
    assert.ok(result.headers['x-correlation-id']);
  }
});
test('GPS resolves the municipality instead of its state capital', async () => {
  const app = setup(async (url) =>
    new URL(url).pathname === '/reverse'
      ? {
          address: {
            country_code: 'br',
            municipality: 'Chapecó',
            'ISO3166-2-lvl4': 'BR-SC',
          },
        }
      : { cidades: rows },
  );
  const result = await request(app)
    .get('/api/v1/localizacoes?latitude=-27.1&longitude=-52.6')
    .expect(200);
  conforms('Localizacao', result.body);
  assert.equal(result.body.cidade.nome, 'Chapecó');
});
test('outside Brazil returns 404 with manual fallback', async () => {
  const result = await request(
    setup(async () => ({ address: { country_code: 'ar' } })),
  )
    .get('/api/v1/localizacoes?latitude=-34&longitude=-58')
    .expect(404);
  conforms('ErroPadronizado', result.body);
});
test('temporary 5xx failures retry with exponential waits and propagate correlation', async () => {
  let attempts = 0;
  const waits = [];
  const client = createHttpClient({
    logger,
    wait: async (ms) => waits.push(ms),
    fetchImpl: async (url, options) => {
      assert.equal(options.headers['X-Correlation-Id'], 'trace');
      attempts++;
      return new Response(attempts < 3 ? '{}' : '{"ok":true}', {
        status: attempts < 3 ? 503 : 200,
      });
    },
  });
  assert.deepEqual(
    await client('https://example.org', { correlationId: 'trace' }),
    { ok: true },
  );
  assert.deepEqual(waits, [500, 1000]);
  assert.equal(attempts, 3);
});
test('provider 400 does not retry and exhausted timeouts return 503', async () => {
  let attempts = 0;
  const noRetry = createHttpClient({
    logger,
    fetchImpl: async () => {
      attempts++;
      return new Response('{}', { status: 400 });
    },
  });
  await assert.rejects(noRetry('https://example.org'), { status: 503 });
  assert.equal(attempts, 1);
  const timeout = createHttpClient({
    logger,
    timeoutMs: 5,
    wait: async () => {},
    fetchImpl: async (url, { signal }) =>
      new Promise((resolve, reject) =>
        signal.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        ),
      ),
  });
  await assert.rejects(timeout('https://example.org'), { status: 503 });
});
test('malformed provider catalogue becomes a documented 503', async () => {
  const result = await request(setup(async () => ({ wrong: true })))
    .get('/api/v1/cidades?uf=SC')
    .expect(503);
  conforms('ErroPadronizado', result.body);
});
