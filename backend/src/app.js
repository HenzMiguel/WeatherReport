import express from 'express';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';
import {
  correlation,
  collectMetrics,
  errorHandler,
} from './controllers/middlewares.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { authRoutes } from './routes/auth.js';
import { metricsRoutes } from './routes/metrics.js';
import { createMetricsService } from './services/metrics.js';
import { AppError } from './services/errors.js';
export function createApp(services, logger = console) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.use(correlation(logger));
  const metrics = services.metrics || createMetricsService();
  app.use(collectMetrics(metrics));
  if (services.auth) app.use('/api/v1', authRoutes(services.auth));
  if (services.auth)
    app.use('/api/v1', metricsRoutes({ auth: services.auth, metrics }));
  app.use('/api/v1', dashboardRoutes(services));
  const contract = YAML.parse(
    readFileSync(new URL('../../SDD/swagger.yaml', import.meta.url), 'utf8'),
  );
  app.get('/api/openapi.json', (req, res) => res.json(contract));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(contract));
  app.use((req, res, next) =>
    next(new AppError(StatusCodes.NOT_FOUND, 'Rota não encontrada.')),
  );
  app.use(errorHandler(logger));
  return app;
}
