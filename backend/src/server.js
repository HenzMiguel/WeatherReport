import { createApp } from './app.js';
import { createHttpClient } from './services/http.js';
import { createCityRepository } from './repositories/cities.js';
import { createLocationService } from './services/location.js';
import { createAlertService } from './services/alerts.js';
import { createHistoryRepository } from './repositories/history.js';
import { createForecastService } from './services/forecast.js';
const requestJson = createHttpClient();
const cities = createCityRepository(requestJson);
const locate = createLocationService(requestJson, cities);
const alerts = createAlertService(requestJson);
const forecast = createForecastService({
  requestJson,
  alerts,
  history: createHistoryRepository(),
});
const app = createApp({ cities, locate, forecast });
const port = Number(process.env.PORT || 3000);
app.listen(port, '127.0.0.1', () =>
  console.log('WeatherReport API: http://localhost:' + port + '/api/docs'),
);
