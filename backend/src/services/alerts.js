import { MemoryCache } from '../repositories/cache.js';
import { unavailable } from './errors.js';
const levels = ['NORMAL', 'ATENCAO', 'ALERTA', 'EMERGENCIA'];
function timestamp(value) {
  if (typeof value !== 'string') return NaN;
  // The provider publishes INMET wall times in Brasilia time.
  return Date.parse(
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)
      ? value.replace(' ', 'T') + ':00-03:00'
      : value,
  );
}
export function mapAlerts(body, city, now = Date.now()) {
  if (!Array.isArray(body.alertas)) throw unavailable();
  const end = now + 7 * 86400000;
  let max = 0;
  const alerts = [];
  for (const item of body.alertas) {
    if (!Array.isArray(item.geocodes)) throw unavailable();
    if (!item.geocodes.some((code) => String(code) === city.codigo_ibge))
      continue;
    const start = timestamp(item.inicio),
      finish = timestamp(item.fim);
    if (!Number.isFinite(start) || !Number.isFinite(finish) || finish < start)
      throw unavailable();
    if (finish < now || start > end) continue;
    const level = Number(item.nivel);
    if (![1, 2, 3].includes(level) || typeof item.evento !== 'string')
      throw unavailable();
    max = Math.max(max, level);
    alerts.push({
      id: String(item.id),
      titulo: item.evento,
      nivel: levels[level],
      inicio: new Date(start).toISOString(),
      fim: new Date(finish).toISOString(),
      descricao: Array.isArray(item.riscos)
        ? item.riscos.filter((x) => typeof x === 'string').join(' ')
        : '',
      instrucoes: Array.isArray(item.instrucoes)
        ? item.instrucoes.filter((x) => typeof x === 'string')
        : [],
    });
  }
  return { level: levels[max], alerts };
}
export function createAlertService(
  requestJson,
  baseUrl = process.env.RADAR_BASE_URL || 'https://radarmeteorologico.com.br',
) {
  const cache = new MemoryCache(27);
  return async (city, correlationId) => {
    let body = cache.get(city.uf);
    if (!body) {
      const url = new URL('/api/v1/alertas', baseUrl);
      url.searchParams.set('uf', city.uf);
      body = await requestJson(url, { correlationId });
      if (!Array.isArray(body.alertas)) throw unavailable();
      cache.set(city.uf, body, 600000);
    }
    return mapAlerts(body, city);
  };
}
