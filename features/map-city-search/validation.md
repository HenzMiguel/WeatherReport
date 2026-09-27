# Validation — City search

Technical validation completed on 2026-09-27.

- PASS: searching for a municipality from the map uses the city catalogue endpoint and presents matching accessible result controls.
- PASS: selecting Chapecó, SC centers the map on its coordinates, renders the selected-city marker, filters to Santa Catarina, and announces the municipality in the status message.
- PASS: the production build and the map Playwright scenarios pass.

Evidence: `frontend/test/map-city-search.spec.js`.
