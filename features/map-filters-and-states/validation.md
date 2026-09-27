# Validation — Alert filters and page states

Technical validation completed on 2026-09-27.

- PASS: alert severity checkboxes immediately add and remove their respective markers, and marker details close when filters change.
- PASS: selecting a state limits markers to that UF; an empty state explains when that consulted area has no matching alerts.
- PASS: the loading state is announced and the map canvas exposes `aria-busy` while the request is pending.
- PASS: an unavailable alert response presents an accessible error and a retry action that can recover the markers.
- PASS: the production build and the Playwright map scenarios pass.

Evidence: `frontend/test/map-filters-and-states.spec.js`.
