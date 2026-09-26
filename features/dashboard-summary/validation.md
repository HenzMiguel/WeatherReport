# Validation — Summary

Technical validation completed on 2026-09-26.

- PASS: same-local-hour comparison with yesterday and explicit nulls for missing values.
- PASS: municipality, validity interval and maximum severity filtering for INMET notices; unknown severity cannot become NORMAL.
- PASS: alerts outage preserves weather with null risk and a visible warning; weather outage becomes standardized 503.
- PASS: real Chapecó response returned current temperature and three applicable notices with no provider warnings, and matched the OpenAPI response schema.
- PASS: desktop summary and mobile unavailable-data states (frontend/test/dashboard.spec.js).

Evidence: backend/test/summary.test.js and backend/test/forecast.test.js. Notice times without offsets use Brasilia time. No fabricated radar reflectivity is returned. The seven-day panel displays published notices overlapping the interval, not a guarantee of complete forecast alert coverage.
