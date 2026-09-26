import { StatusCodes } from 'http-status-codes';
import { AppError, unavailable } from './errors.js';
import { normalize } from '../repositories/cities.js';
import { MemoryCache } from '../repositories/cache.js';
import { createRateGate } from './http.js';
export function createLocationService(
  requestJson,
  cities,
  baseUrl = process.env.NOMINATIM_BASE_URL ||
    'https://nominatim.openstreetmap.org',
) {
  const cache = new MemoryCache();
  const gate = createRateGate();
  return async (latitude, longitude, correlationId) => {
    const key = latitude.toFixed(4) + ':' + longitude.toFixed(4);
    const cached = cache.get(key);
    if (cached) return cached;
    const url = new URL('/reverse', baseUrl);
    for (const [k, v] of Object.entries({
      format: 'jsonv2',
      lat: latitude,
      lon: longitude,
      zoom: 10,
      'accept-language': 'pt-BR',
    }))
      url.searchParams.set(k, v);
    const body = await requestJson(url, { correlationId, beforeAttempt: gate });
    if (body.error)
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'Não foi possível identificar uma cidade. Use a busca manual.',
      );
    if (!body.address) throw unavailable();
    const address = body.address;
    if (address.country_code !== 'br')
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'A localização informada não corresponde a uma cidade brasileira.',
      );
    const uf = address['ISO3166-2-lvl4']?.replace('BR-', '');
    const names = [
      address.municipality,
      address.city,
      address.town,
      address.village,
      body.name,
    ].filter(Boolean);
    if (!uf || names.length === 0)
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'Município não identificado. Use a busca manual.',
      );
    const candidates = await cities.search({ uf }, correlationId);
    const city = candidates.find((c) =>
      names.some((name) => normalize(c.nome) === normalize(name)),
    );
    if (!city)
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'Município não encontrado no catálogo. Use a busca manual.',
      );
    return cache.set(
      key,
      {
        cidade: city,
        fonte: 'OpenStreetMap / Nominatim e Radar Meteorológico',
        mensagem:
          'Confira a cidade identificada; você pode alterá-la pela busca manual.',
      },
      24 * 3600000,
    );
  };
}
