# Validation — History

Technical validation completed on 2026-09-26.

- PASS: eight local calendar dates (today through seven days ago), exactly 24 hourly slots, no future data in historical charts.
- PASS: daily means mark today/insufficient samples as partial; missing values remain gaps.
- PASS: moving average uses three consecutive hours and does not bridge missing values.
- PASS: known anomaly values, zero variance, noisy reference and insufficient baseline.
- PASS: date boundaries in America/Manaus and local-time display.
- PASS: cache coalescing, JSON persistence, reload of valid persisted data and rejection of expired persisted data.
- PASS: two charts, exact-value tables and anomaly list rendered in Edge.

Evidence: backend/test/history.test.js, backend/test/forecast.test.js and frontend/test/dashboard.spec.js. The anomaly is a documented short-window statistical indicator, not a claim about a climatological normal.
