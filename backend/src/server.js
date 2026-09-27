import { readFileSync } from 'node:fs';
import { createApp } from './app.js';
import { createHttpClient } from './services/http.js';
import { createCityRepository } from './repositories/cities.js';
import { createLocationService } from './services/location.js';
import { createAlertService } from './services/alerts.js';
import { createHistoryRepository } from './repositories/history.js';
import { createForecastService } from './services/forecast.js';
import {
  createAuthService,
  createUnavailableAuthService,
  parseAdministrators,
} from './services/auth.js';
import { createMetricsService } from './services/metrics.js';
const requestJson = createHttpClient();
const cities = createCityRepository(requestJson);
const locate = createLocationService(requestJson, cities);
const alerts = createAlertService(requestJson);
const forecast = createForecastService({
  requestJson,
  alerts,
  history: createHistoryRepository(),
});
let auth;
try {
  const adminsFile = readFileSync(
    new URL('../../admins.txt', import.meta.url),
    'utf8',
  );
  auth = createAuthService({
    administrators: parseAdministrators(adminsFile),
    secret: process.env.AUTH_SECRET,
  });
} catch (error) {
  console.warn('Acesso administrativo indisponível: ' + error.message);
  auth = createUnavailableAuthService();
}
const app = createApp({
  cities,
  locate,
  forecast,
  auth,
  metrics: createMetricsService(),
});
const port = Number(process.env.PORT || 3000);
app.listen(port, '127.0.0.1', () =>
  console.log('WeatherReport API: http://localhost:' + port + '/api/docs'),
);
