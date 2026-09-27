# Administrative panel — System metrics

- Provide `GET /admin/metricas` exclusively to authenticated administrators.
- Record each completed HTTP request in process memory and classify responses with a status of 400 or greater as errors.
- Return a rolling one-hour reference period, with request counts grouped into one-minute intervals.
- Return error count, process CPU usage percentage, and resident memory consumption in MB.
- Present all metrics in an accessible administrative dashboard with the reference period visible.
