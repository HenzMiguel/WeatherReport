# Administrative panel — System metrics

- Provide `GET /admin/metricas` exclusively to authenticated administrators.
- Record each completed HTTP request in process memory and classify responses with a status of 400 or greater as errors.
- Return a rolling one-hour reference period, with request, error, CPU, and memory readings grouped into one-minute intervals.
- Return error count, process CPU usage percentage, resident memory consumption in MB, and up to 100 most recent generated errors. Each error exposes timestamp, method, route, HTTP status, and correlation ID; query parameters and request bodies are never retained.
- Present all metrics as accessible charts in the administrative dashboard, with the reference period visible.
