# Dashboard — Weather summary

- Display the most recent modelled current temperature (degrees Celsius), source timestamp and city time zone.
- Compare the current temperature with yesterday's hourly temperature at the same local hour (current time rounded down to the hour). Null means unavailable, never zero.
- Show official INMET notices supplied by Radar Meteorologico that affect the selected IBGE municipality and overlap now through seven days from now. Map levels 1/2/3 to ATENCAO/ALERTA/EMERGENCIA; choose the highest applicable level.
- NORMAL means no published notice in the consulted interval, not a guarantee of safe weather. Explain that the provider supplies published notices, not guaranteed seven-day alert coverage.
- If the alert source fails or has incomplete/unknown severity data, preserve available weather, return null risk and a warning. Do not claim NORMAL. If weather fails after retries, return the documented 503.
- Keep current Swagger fields and add the missing metadata. Radar reflectivity is optional and unavailable in these public endpoints; never invent a value.
- Cache weather for 10 minutes and persist successful processed responses as JSON. Never serve expired persisted forecasts as current data.

Sources: https://open-meteo.com/en/docs ; https://radarmeteorologico.com.br/api-publica
