import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHistory, calculateAnomaly } from '../src/services/history.js';
export function sampleWeather(now = Date.parse('2026-09-26T15:15:00Z') / 1000) {
  const hour = Math.floor(now / 3600) * 3600;
  const time = Array.from({ length: 240 }, (_, i) => hour - (215 - i) * 3600);
  return {
    current: { time: now, temperature_2m: 24 },
    hourly: { time, temperature_2m: time.map(() => 20) },
  };
}
test('history returns eight dates, exactly 24 hours and excludes future forecasts', () => {
  const source = sampleWeather();
  source.hourly.temperature_2m[
    source.hourly.time.indexOf(Math.floor(source.current.time / 3600) * 3600)
  ] = 26;
  const output = buildHistory(source, 'America/Sao_Paulo');
  assert.equal(output.grafico_semanal.length, 8);
  assert.equal(output.historico_24h.length, 24);
  assert.equal(output.grafico_semanal[0].data, '2026-09-19');
  assert.equal(output.grafico_semanal.at(-1).data, '2026-09-26');
  assert.equal(output.grafico_semanal.at(-1).parcial, true);
  assert.equal(output.grafico_semanal.at(-1).amostras, 13);
  const last = output.historico_24h.at(-1);
  assert.equal(last.temperatura, 26);
  assert.equal(last.media_movel, 22);
  assert.equal(last.anomalia, true);
  assert.equal(last.media_referencia, 20);
  assert.ok(
    output.historico_24h.every(
      (p) => Date.parse(p.horario) <= source.current.time * 1000,
    ),
  );
});
test('missing samples remain gaps and do not bridge a moving average', () => {
  const source = sampleWeather();
  source.hourly.temperature_2m[214] = null;
  const output = buildHistory(source, 'America/Sao_Paulo');
  assert.equal(output.historico_24h.at(-2).temperatura, null);
  assert.equal(output.historico_24h.at(-1).media_movel, null);
});
test('anomaly threshold and missing baseline are explicit', () => {
  assert.equal(
    calculateAnomaly(25, [20, 20, 20, 20, 20, 20, 20]).anomalia,
    true,
  );
  assert.equal(
    calculateAnomaly(21, [20, 20, 20, 20, 20, 20, 20]).anomalia,
    false,
  );
  assert.equal(
    calculateAnomaly(25, [20, null, 20, 20, 20, 20, 20]).anomalia,
    null,
  );
  assert.equal(
    calculateAnomaly(40, [10, 15, 20, 25, 30, 35, 40]).anomalia,
    false,
  );
});
test('local date uses city time zone near midnight', () => {
  const output = buildHistory(
    sampleWeather(Date.parse('2026-09-26T02:15:00Z') / 1000),
    'America/Manaus',
  );
  assert.equal(output.grafico_semanal.at(-1).data, '2026-09-25');
});
