import { v5 as uuidv5 } from 'uuid';
import { unavailable } from '../services/errors.js';
import { MemoryCache } from './cache.js';
export const UFS =
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(
    ' ',
  );
export const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const TTL = 24 * 60 * 60 * 1000;
export const cityId = (ibge) =>
  uuidv5('weatherreport:ibge:' + ibge, uuidv5.URL);
export function createCityRepository(
  requestJson,
  baseUrl = process.env.RADAR_BASE_URL || 'https://radarmeteorologico.com.br',
) {
  const cache = new MemoryCache();
  const byId = new Map();
  async function search({ nome = '', uf = '' }, correlationId) {
    const key = normalize(nome) + ':' + uf;
    let cities = cache.get(key);
    if (!cities) {
      const url = new URL('/api/v1/cidades', baseUrl);
      // Query by UF when supplied, then apply the partial name filter locally.
      if (uf) url.searchParams.set('uf', uf);
      else url.searchParams.set('q', nome);
      const body = await requestJson(url, { correlationId });
      if (
        !Array.isArray(body.cidades) ||
        body.cidades.some(
          (c) =>
            !/^\d{7}$/.test(String(c.ibge)) ||
            typeof c.nome !== 'string' ||
            !UFS.includes(c.uf) ||
            !Number.isFinite(c.latitude) ||
            !Number.isFinite(c.longitude) ||
            typeof c.fuso !== 'string',
        )
      )
        throw unavailable();
      cities = body.cidades
        .map((c) => ({
          id: cityId(c.ibge),
          codigo_ibge: String(c.ibge),
          nome: c.nome,
          uf: c.uf,
          latitude: c.latitude,
          longitude: c.longitude,
          fuso_horario: c.fuso,
          nivel_risco: null,
        }))
        .filter(
          (c) =>
            (!uf || c.uf === uf) && normalize(c.nome).includes(normalize(nome)),
        )
        .sort(
          (a, b) =>
            a.nome.localeCompare(b.nome, 'pt-BR') || a.uf.localeCompare(b.uf),
        );
      for (const city of cities) byId.set(city.id, city);
      cache.set(key, cities, TTL);
    }
    return cities;
  }
  return { search, find: (id) => byId.get(id) };
}
