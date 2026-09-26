import { finite, localParts, shiftDate, round } from './weather.js';
export function calculateAnomaly(value, reference) {
  if (
    !finite(value) ||
    reference.length !== 7 ||
    reference.some((v) => !finite(v))
  )
    return {
      media_referencia: null,
      desvio: null,
      z_score: null,
      anomalia: null,
    };
  const mean = reference.reduce((a, b) => a + b, 0) / 7;
  const deviation = value - mean;
  const std = Math.sqrt(
    reference.reduce((sum, n) => sum + (n - mean) ** 2, 0) / 7,
  );
  const z = std === 0 ? null : deviation / std;
  return {
    media_referencia: round(mean),
    desvio: round(deviation),
    z_score: z === null ? null : round(z),
    anomalia: Math.abs(deviation) >= 2 && (std === 0 || Math.abs(z) >= 2),
  };
}
export function buildHistory(weather, timezone) {
  const now = weather.current.time;
  const hour = Math.floor(now / 3600) * 3600;
  const today = localParts(now, timezone).date;
  const byTime = new Map(),
    byLocal = new Map();
  weather.hourly.time.forEach((time, i) => {
    if (time > now) return;
    const value = weather.hourly.temperature_2m[i];
    byTime.set(time, finite(value) ? value : null);
    const p = localParts(time, timezone);
    byLocal.set(p.date + 'T' + p.hour, finite(value) ? value : null);
  });
  const grafico_semanal = Array.from({ length: 8 }, (_, i) => {
    const date = shiftDate(today, i - 7);
    const values = [...byTime]
      .filter(([t, v]) => localParts(t, timezone).date === date && finite(v))
      .map(([, v]) => v);
    return {
      data: date,
      temperatura: values.length
        ? round(values.reduce((a, b) => a + b, 0) / values.length)
        : null,
      parcial: date === today || values.length < 24,
      amostras: values.length,
    };
  });
  const historico_24h = Array.from({ length: 24 }, (_, i) => {
    const time = hour - (23 - i) * 3600;
    const value = byTime.get(time) ?? null;
    const rolling = [byTime.get(time - 7200), byTime.get(time - 3600), value];
    const parts = localParts(time, timezone);
    const reference = Array.from({ length: 7 }, (_, day) =>
      byLocal.get(shiftDate(parts.date, -day - 1) + 'T' + parts.hour),
    );
    return {
      horario: new Date(time * 1000).toISOString(),
      temperatura: value === null ? null : round(value),
      media_movel: rolling.every(finite)
        ? round(rolling.reduce((a, b) => a + b, 0) / 3)
        : null,
      ...calculateAnomaly(value, reference),
    };
  });
  return { grafico_semanal, historico_24h };
}
