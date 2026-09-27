# Map — Climate alerts

- Fetch active INMET alerts from the map-alert endpoint and render one geographic point for every covered municipality.
- Give every point a distinct, non-color-only severity treatment for `ALERTA` and `EMERGENCIA`, and provide an accessible legend.
- Marker geometry must scale inversely to the SVG viewBox, keeping a small fixed on-screen footprint while zooming and preventing it from dominating the municipality location.
- A marker must be keyboard reachable and expose its city, alert title, and severity to assistive technology.
- Selecting a marker must reveal its title, severity, location, active period, description, and any safety instructions.
- The map endpoint must return only alerts that overlap the current time through the next seven days. Point coordinates must be the coordinates of the covered municipality, not fabricated locations.
