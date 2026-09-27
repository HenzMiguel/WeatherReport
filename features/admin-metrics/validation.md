# Validation — System metrics

Technical validation completed on 2026-09-27.

- PASS: unauthenticated requests to `GET /admin/metricas` return 401.
- PASS: administrators receive a 60-minute series with 60 one-minute buckets, error count, CPU percentage, and resident memory in MB.
- PASS: the administrative interface renders the metrics and labels the rolling one-hour reference period.

Evidence: `backend/test/metrics.test.js` and `frontend/test/admin.spec.js`.
