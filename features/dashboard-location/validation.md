# Validation — Location

Technical validation completed on 2026-09-26 before final dashboard review.

- PASS: non-capital search, accent/case normalization, UF filter, pagination and stable UUIDs (backend/test/location.test.js).
- PASS: 400 for invalid/duplicate query parameters, 404 outside Brazil, standardized 503 for invalid provider responses.
- PASS: temporary 5xx retry, exponential waits of 500/1000 ms, timeout exhaustion, no retry for provider 400, correlation propagation.
- PASS: browser manual search, denied GPS fallback and granted GPS city confirmation (frontend/test/location.spec.js; Edge, headless).
- PASS: live provider lookup returned Chapecó and Águas de Chapecó, SC. No capital-only restriction.
- PASS: OpenAPI schema validation and response checks.

The municipality lookup uses an external catalogue; provider coverage determines availability. Browser GPS is approximate, so the user confirms the inferred municipality. OS permission dialogs were simulated with browser permissions in automated tests; the user's physical location was not accessed.
