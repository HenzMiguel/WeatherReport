import { Router } from 'express';
import { createDashboardControllers } from '../controllers/dashboard.js';
export function dashboardRoutes(services) {
  const router = Router();
  const controller = createDashboardControllers(services);
  // Shared JWT middleware can be mounted here once the team updates the contract.
  router.get('/cidades', controller.list);
  router.get('/localizacoes', controller.location);
  router.get('/cidades/:id/previsao', controller.weather);
  return router;
}
