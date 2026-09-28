const MINUTE = 60_000;
const WINDOW = 60 * MINUTE;
const percentage = (value) => Math.round(value * 10) / 10;
export function createMetricsService({
  now = () => Date.now(),
  cpuUsage = () => process.cpuUsage(),
  memoryUsage = () => process.memoryUsage(),
  cpuCount = () => 1,
} = {}) {
  const requests = [];
  const samples = [];
  let previousCpu = cpuUsage();
  let previousSample = now();
  let latestCpu = 0;
  let latestMemory = percentage(memoryUsage().rss / 1024 / 1024);
  const discardExpired = (current) => {
    while (requests.length && requests[0].at < current - WINDOW)
      requests.shift();
    while (samples.length && samples[0].at < current - WINDOW) samples.shift();
  };
  const sampleResources = (at) => {
    const usage = cpuUsage();
    const elapsedMicros = Math.max(1, (at - previousSample) * 1000);
    const cpuMicros = Math.max(
      0,
      usage.user + usage.system - previousCpu.user - previousCpu.system,
    );
    latestCpu = percentage(
      (cpuMicros / elapsedMicros / Math.max(1, cpuCount())) * 100,
    );
    latestMemory = percentage(memoryUsage().rss / 1024 / 1024);
    previousCpu = usage;
    previousSample = at;
    samples.push({ at, cpu: latestCpu, memory: latestMemory });
  };
  return {
    record({ status, method, path, correlationId } = {}) {
      const at = now();
      discardExpired(at);
      requests.push({ at, status, method, path, correlationId });
      sampleResources(at);
    },
    snapshot() {
      const current = now();
      discardExpired(current);
      const buckets = Array.from({ length: 60 }, (_, index) => {
        const start = current - WINDOW + index * MINUTE;
        return {
          inicio: new Date(start).toISOString(),
          fim: new Date(start + MINUTE).toISOString(),
          quantidade: 0,
        };
      });
      const errorBuckets = buckets.map(({ inicio, fim }) => ({
        inicio,
        fim,
        quantidade: 0,
      }));
      const cpuBuckets = buckets.map(({ inicio, fim }) => ({
        inicio,
        fim,
        porcentagem: null,
      }));
      const memoryBuckets = buckets.map(({ inicio, fim }) => ({
        inicio,
        fim,
        megabytes: null,
      }));
      let windowErrors = 0;
      for (const request of requests) {
        const index = Math.min(
          59,
          Math.floor((request.at - (current - WINDOW)) / MINUTE),
        );
        if (index >= 0) buckets[index].quantidade += 1;
        if (request.status >= 400) {
          errorBuckets[index].quantidade += 1;
          windowErrors += 1;
        }
      }
      for (const sample of samples) {
        const index = Math.min(
          59,
          Math.floor((sample.at - (current - WINDOW)) / MINUTE),
        );
        if (index >= 0) {
          cpuBuckets[index].porcentagem = sample.cpu;
          memoryBuckets[index].megabytes = sample.memory;
        }
      }
      const errors = requests
        .filter((request) => request.status >= 400)
        .slice(-100)
        .reverse()
        .map(({ at, method, path, status, correlationId }) => ({
          timestamp: new Date(at).toISOString(),
          metodo: method,
          rota: path,
          status,
          correlation_id: correlationId,
        }));
      return {
        periodo: {
          inicio: new Date(current - WINDOW).toISOString(),
          fim: new Date(current).toISOString(),
          intervalo_segundos: 60,
        },
        total_requisicoes: requests.length,
        total_erros: windowErrors,
        uso_cpu_porcentagem: latestCpu,
        consumo_memoria_mb: latestMemory,
        requisicoes_por_intervalo: buckets,
        erros_por_intervalo: errorBuckets,
        uso_cpu_por_intervalo: cpuBuckets,
        consumo_memoria_por_intervalo: memoryBuckets,
        erros: errors,
      };
    },
  };
}
