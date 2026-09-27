export function createMetricsControllers(metrics) {
  return { system: (req, res) => res.json(metrics.snapshot()) };
}
