# Validation — Climate alerts

Technical validation completed on 2026-09-26.

- PASS: active INMET alerts are consolidated by the map endpoint into municipality-coordinate points, excluding expired and future-only notices.
- PASS: attention, alert, and emergency markers have distinct shapes and colors, and the accessible legend names every severity.
- PASS: markers scale inversely to the map viewBox; the browser test confirms that the marker geometry contracts when the map zooms in.
- PASS: keyboard-reachable markers announce severity, title, city, and UF; selecting one opens its full detail panel.
- PASS: the detail panel includes severity, municipality, active period, description, and published safety instructions.
- PASS: OpenAPI validation, 20 backend tests, 10 Playwright scenarios, and the production build pass.

Evidence: `backend/test/map-alerts.test.js` and `frontend/test/map-alerts.spec.js`.
