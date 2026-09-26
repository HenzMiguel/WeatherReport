import express from 'express';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';
import { correlation, errorHandler } from './controllers/middlewares.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { AppError } from './services/errors.js';
export function createApp(services, logger = console) {
  const app = express();
  app.disable('x-powered-by');
  app.use(correlation(logger));
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
