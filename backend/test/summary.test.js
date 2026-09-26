import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summary } from '../src/services/weather.js';
import { mapAlerts } from '../src/services/alerts.js';
const city = { codigo_ibge: '4204202' };
const now = Date.parse('2026-09-26T15:00:00Z');
const alert = {
  id: 1,
  evento: 'Chuva',
  nivel: 2,
  inicio: '2026-09-26 10:00',
  fim: '2026-09-27 18:00',
  geocodes: [4204202],
  riscos: ['Chuva intensa'],
  instrucoes: ['Consulte a Defesa Civil.'],
};
test('summary compares current temperature with yesterday same local hour', () => {
  const weather = {
    current: { time: now / 1000, temperature_2m: 24.5 },
    hourly: { time: [now / 1000 - 86400], temperature_2m: [22.4] },
  };
  assert.deepEqual(summary(weather, 'America/Sao_Paulo'), {
    temperatura_hoje: 24.5,
    diferenca_temperatura_ontem: 2.1,
  });
  weather.hourly.temperature_2m[0] = null;
  assert.equal(
    summary(weather, 'America/Sao_Paulo').diferenca_temperatura_ontem,
    null,
  );
  weather.current.temperature_2m = null;
  assert.equal(summary(weather, 'America/Sao_Paulo').temperatura_hoje, null);
});
test('risk uses municipality and overlapping dates and highest published severity', () => {
  const result = mapAlerts(
    {
      alertas: [
        alert,
        { ...alert, id: 2, nivel: 3 },
        { ...alert, id: 3, geocodes: [1234567] },
        { ...alert, id: 4, fim: '2026-09-26 11:00' },
        {
          ...alert,
          id: 5,
          inicio: '2026-10-10 10:00',
          fim: '2026-10-11 10:00',
        },
      ],
    },
    city,
    now,
  );
  assert.equal(result.level, 'EMERGENCIA');
  assert.equal(result.alerts.length, 2);
  assert.equal(result.alerts[0].inicio, '2026-09-26T13:00:00.000Z');
  assert.equal(mapAlerts({ alertas: [] }, city, now).level, 'NORMAL');
});
test('unknown severity and malformed dates cannot become NORMAL', () => {
  assert.throws(
    () => mapAlerts({ alertas: [{ ...alert, nivel: 9 }] }, city, now),
    { status: 503 },
  );
  assert.throws(
    () => mapAlerts({ alertas: [{ ...alert, fim: 'wrong' }] }, city, now),
    { status: 503 },
  );
});
