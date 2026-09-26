import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import Parser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
const base = 'http://127.0.0.1:3000/api/v1';
async function get(path) {
  const r = await fetch(base + path, { signal: AbortSignal.timeout(60000) });
  const body = await r.json();
  assert.equal(r.status, 200, JSON.stringify(body));
  return body;
}
const catalogue = await get('/cidades?nome=Chapeco&uf=SC');
const city = catalogue.dados.find((c) => c.nome === 'Chapecó');
assert.ok(city);
const data = await get('/cidades/' + city.id + '/previsao');
const doc = await Parser.dereference('SDD/swagger.yaml');
const check = addFormats(new Ajv({ strict: false })).compile(
  doc.components.schemas.DetalhePrevisaoCidade,
);
assert.ok(check(data), JSON.stringify(check.errors));
const location = await get('/localizacoes?latitude=-27.1&longitude=-52.6');
assert.equal(location.cidade.nome, 'Chapecó');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173');
  await page.getByLabel('Cidade', { exact: true }).fill('Chapecó');
  await page.getByLabel('Estado', { exact: true }).selectOption('SC');
  await page.getByRole('button', { name: 'Buscar cidade' }).click();
  await page.getByRole('button', { name: 'Chapecó SC', exact: true }).click();
  await page
    .getByRole('heading', { name: 'As últimas 24 horas' })
    .waitFor({ timeout: 60000 });
  await mkdir('test-results', { recursive: true });
  await page.screenshot({
    path: 'test-results/dashboard-live.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: 'test-results/dashboard-live-mobile.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        city: data.nome,
        temperature: data.temperatura_hoje,
        risk: data.nivel_risco_semana,
        alerts: data.risco_semana.alertas.length,
        hours: data.historico_24h.length,
        days: data.grafico_semanal.length,
        contract: 'valid',
        gps: location.cidade.nome,
        browser: 'desktop and mobile passed',
        warnings: data.avisos,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
