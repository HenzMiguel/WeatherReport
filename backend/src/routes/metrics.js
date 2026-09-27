import { Router } from 'express';
import { requireAdmin } from '../controllers/middlewares.js';
import { createMetricsControllers } from '../controllers/metrics.js';
export function metricsRoutes({ auth, metrics }) {
  const router = Router();
  const controller = createMetricsControllers(metrics);
  router.get('/admin/metricas', requireAdmin(auth), controller.system);
  return router;
}
