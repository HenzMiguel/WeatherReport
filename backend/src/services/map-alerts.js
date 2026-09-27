import { UFS } from '../repositories/cities.js';
import { MemoryCache } from '../repositories/cache.js';
import { unavailable } from './errors.js';

const levels = ['NORMAL', 'NORMAL', 'ALERTA', 'EMERGENCIA'];

function timestamp(value) {
  if (typeof value !== 'string') return NaN;
  return Date.parse(
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)
      ? value.replace(' ', 'T') + ':00-03:00'
      : value,
  );
}

function details(item, level, start, finish) {
  if (typeof item.id !== 'string' && typeof item.id !== 'number')
    throw unavailable();
  if (typeof item.evento !== 'string' || !Array.isArray(item.geocodes))
    throw unavailable();
  return {
    alerta_id: String(item.id),
    titulo: item.evento,
    nivel: levels[level],
    inicio: new Date(start).toISOString(),
    fim: new Date(finish).toISOString(),
    descricao: Array.isArray(item.riscos)
      ? item.riscos.filter((value) => typeof value === 'string').join(' ')
      : '',
    instrucoes: Array.isArray(item.instrucoes)
      ? item.instrucoes.filter((value) => typeof value === 'string')
      : [],
  };
}

export function createMapAlertService({ cities, requestJson, baseUrl }) {
  const cache = new MemoryCache();
  const provider =
    baseUrl ||
    process.env.RADAR_BASE_URL ||
    'https://radarmeteorologico.com.br';
  return async function active(correlationId, now = Date.now()) {
    const cached = cache.get('active');
    if (cached) return cached;
    const end = now + 7 * 86400000;
    const responses = await Promise.all(
      UFS.map(async (uf) => {
        const url = new URL('/api/v1/alertas', provider);
        url.searchParams.set('uf', uf);
        const [municipalities, body] = await Promise.all([
          cities.search({ uf }, correlationId),
          requestJson(url, { correlationId }),
        ]);
        if (!Array.isArray(body.alertas)) throw unavailable();
        return { municipalities, alerts: body.alertas };
      }),
    );
    const points = [];
    for (const { municipalities, alerts } of responses) {
      const byIbge = new Map(
        municipalities.map((city) => [city.codigo_ibge, city]),
      );
      for (const item of alerts) {
        const start = timestamp(item.inicio);
        const finish = timestamp(item.fim);
        const level = Number(item.nivel);
        if (
          !Number.isFinite(start) ||
          !Number.isFinite(finish) ||
          finish < start ||
          ![1, 2, 3].includes(level)
        )
          throw unavailable();
        if (finish < now || start > end) continue;
        if (level === 1) continue;
        const alert = details(item, level, start, finish);
        for (const code of item.geocodes) {
          const city = byIbge.get(String(code));
          if (!city) continue;
          points.push({
            id: `${alert.alerta_id}:${city.codigo_ibge}`,
            ...alert,
            cidade: city.nome,
            uf: city.uf,
            latitude: city.latitude,
            longitude: city.longitude,
          });
        }
      }
    }
    const result = {
      atualizado_em: new Date(now).toISOString(),
      alertas: points,
    };
    cache.set('active', result, 600000);
    return result;
  };
}
