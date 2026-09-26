import { unavailable } from './errors.js';
export const finite = (value) =>
  typeof value === 'number' && Number.isFinite(value);
export const round = (value) => Math.round(value * 10) / 10;
const formatters = new Map();
export function localParts(seconds, timezone) {
  if (!formatters.has(timezone))
    formatters.set(
      timezone,
      new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hourCycle: 'h23',
      }),
    );
  const parts = Object.fromEntries(
    formatters
      .get(timezone)
      .formatToParts(new Date(seconds * 1000))
      .map((p) => [p.type, p.value]),
  );
  return {
    date: parts.year + '-' + parts.month + '-' + parts.day,
    hour: parts.hour,
  };
}
export function shiftDate(date, days) {
  const value = new Date(date + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export async function fetchWeather(city, requestJson, correlationId) {
  const url = new URL(
    '/v1/forecast',
    process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com',
  );
  for (const [key, value] of Object.entries({
    latitude: city.latitude,
    longitude: city.longitude,
    current: 'temperature_2m',
    hourly: 'temperature_2m',
    past_days: 8,
    forecast_days: 7,
    timezone: city.fuso_horario,
    timeformat: 'unixtime',
    temperature_unit: 'celsius',
  }))
    url.searchParams.set(key, value);
  const body = await requestJson(url, { correlationId });
  if (
    !finite(body.current?.time) ||
    !Array.isArray(body.hourly?.time) ||
    !Array.isArray(body.hourly?.temperature_2m) ||
    body.hourly.time.length !== body.hourly.temperature_2m.length ||
    body.hourly.time.some((t) => !finite(t))
  )
    throw unavailable();
  // Reject a stale/malformed provider response, rather than presenting it as current.
  if (Math.abs(Date.now() / 1000 - body.current.time) > 3 * 3600)
    throw unavailable();
  return body;
}
export function summary(weather, timezone) {
  const current = finite(weather.current.temperature_2m)
    ? weather.current.temperature_2m
    : null;
  const { date, hour } = localParts(weather.current.time, timezone);
  const previous = shiftDate(date, -1);
  const index = weather.hourly.time.findIndex((t) => {
    const p = localParts(t, timezone);
    return p.date === previous && p.hour === hour;
  });
  const yesterday = weather.hourly.temperature_2m[index];
  return {
    temperatura_hoje: current === null ? null : round(current),
    diferenca_temperatura_ontem:
      current !== null && finite(yesterday) ? round(current - yesterday) : null,
  };
}
