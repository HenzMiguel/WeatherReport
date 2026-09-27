# Validation — System metrics

Technical validation completed on 2026-09-27.

- PASS: unauthenticated requests to `GET /admin/metricas` return 401.
- PASS: administrators receive four 60-minute series (requests, errors, CPU, and memory), error count, and the most recent generated errors without query parameters or request bodies.
- PASS: the administrative interface renders a graph for each metric, lists generated errors, and labels the rolling one-hour reference period.

Evidence: `backend/test/metrics.test.js` and `frontend/test/admin.spec.js`.
