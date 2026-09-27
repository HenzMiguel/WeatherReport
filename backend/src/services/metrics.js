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
  let previousCpu = cpuUsage();
  let previousSample = now();
  const discardExpired = (current) => {
    while (requests.length && requests[0].at < current - WINDOW)
      requests.shift();
  };
  return {
    record(status) {
      const at = now();
      discardExpired(at);
      requests.push({ at, error: status >= 400 });
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
      let windowErrors = 0;
      for (const request of requests) {
        const index = Math.min(
          59,
          Math.floor((request.at - (current - WINDOW)) / MINUTE),
        );
        if (index >= 0) buckets[index].quantidade += 1;
        if (request.error) windowErrors += 1;
      }
      const usage = cpuUsage();
      const elapsedMicros = Math.max(1, (current - previousSample) * 1000);
      const cpuMicros = Math.max(
        0,
        usage.user + usage.system - previousCpu.user - previousCpu.system,
      );
      previousCpu = usage;
      previousSample = current;
      return {
        periodo: {
          inicio: new Date(current - WINDOW).toISOString(),
          fim: new Date(current).toISOString(),
          intervalo_segundos: 60,
        },
        total_requisicoes: requests.length,
        total_erros: windowErrors,
        uso_cpu_porcentagem: percentage(
          (cpuMicros / elapsedMicros / Math.max(1, cpuCount())) * 100,
        ),
        consumo_memoria_mb: percentage(memoryUsage().rss / 1024 / 1024),
        requisicoes_por_intervalo: buckets,
      };
    },
  };
}
