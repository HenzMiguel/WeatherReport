import { MemoryCache } from '../repositories/cache.js';
import { fetchWeather, summary } from './weather.js';
import { buildHistory } from './history.js';
const TTL = 600000;
export function createForecastService({
  requestJson,
  alerts,
  history,
  logger = console,
}) {
  const cache = new MemoryCache(100),
    pending = new Map();
  async function load(city, correlationId) {
    const cacheKey = city.id;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    try {
      const saved = await history.read(city.id);
      if (
        saved &&
        saved.expires > Date.now() &&
        saved.data?.cidade_id === city.id &&
        saved.data?.historico_24h?.length === 24
      )
        return cache.set(cacheKey, saved.data, saved.expires - Date.now());
    } catch (error) {
      logger.warn(
        JSON.stringify({
          event: 'history_read_failed',
          correlationId,
          reason: error.code,
        }),
      );
    }
    const [weatherResult, alertResult] = await Promise.allSettled([
      fetchWeather(city, requestJson, correlationId),
      alerts(city, correlationId),
    ]);
    if (weatherResult.status === 'rejected') throw weatherResult.reason;
    const weather = weatherResult.value;
    const temperatures = summary(weather, city.fuso_horario);
    const series = buildHistory(weather, city.fuso_horario);
    const now = Date.now();
    const warnings = [];
    if (temperatures.temperatura_hoje === null)
      warnings.push('Temperatura atual indisponível na fonte.');
    if (temperatures.diferenca_temperatura_ontem === null)
      warnings.push('Comparação com ontem indisponível.');
    if (series.historico_24h.some((p) => p.temperatura === null))
      warnings.push(
        'Há lacunas no histórico; valores ausentes não foram estimados.',
      );
    if (alertResult.status === 'rejected')
      warnings.push(
        'Fonte de alertas indisponível. Não foi possível determinar o risco da semana.',
      );
    const data = {
      cidade_id: city.id,
      nome: city.nome,
      uf: city.uf,
      fuso_horario: city.fuso_horario,
      atualizado_em: new Date(weather.current.time * 1000).toISOString(),
      consultado_em: new Date(now).toISOString(),
      fonte: 'Open-Meteo (dados de modelos meteorológicos)',
      ...temperatures,
      nivel_risco_semana:
        alertResult.status === 'fulfilled' ? alertResult.value.level : null,
      risco_semana: {
        inicio: new Date(now).toISOString(),
        fim: new Date(now + 7 * 86400000).toISOString(),
        fonte: 'INMET via Radar Meteorológico',
        cobertura:
          'Avisos publicados que intersectam os próximos sete dias. Ausência de aviso não garante ausência de risco.',
        alertas:
          alertResult.status === 'fulfilled' ? alertResult.value.alerts : [],
      },
      ...series,
      metodologia: {
        comparacao_ontem:
          'Temperatura atual menos a temperatura de ontem na mesma hora local, arredondada para baixo.',
        grafico_semanal:
          'Média das temperaturas horárias disponíveis de hoje e dos sete dias anteriores. Hoje é parcial; horas futuras são excluídas.',
        media_movel:
          'Média de três horas consecutivas. Exige três valores disponíveis.',
        anomalias:
          'Anomalia estatística: compara com o mesmo horário dos sete dias anteriores. Exige sete amostras, desvio absoluto ≥ 2 °C e |z-score| ≥ 2. Se a variância for zero, usa desvio ≥ 2 °C. Não é uma normal climatológica.',
      },
      avisos: warnings,
    };
    // Do not persist a partial failure: the next refresh can retry the alert provider.
    if (alertResult.status === 'fulfilled') {
      try {
        await history.save(city.id, { expires: now + TTL, data });
      } catch (error) {
        logger.warn(
          JSON.stringify({
            event: 'history_write_failed',
            correlationId,
            reason: error.code,
          }),
        );
      }
      cache.set(cacheKey, data, TTL);
    }
    return data;
  }
  return (city, correlationId) => {
    if (!pending.has(city.id))
      pending.set(
        city.id,
        load(city, correlationId).finally(() => pending.delete(city.id)),
      );
    return pending.get(city.id);
  };
}
