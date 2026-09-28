# Map — Geographic scope

- Render a geographically faithful Brazilian political map with the 26 states and the Federal District as individually identifiable SVG areas.
- A user can click, or use Enter/Space on, any state to zoom the map to that state. Mouse-wheel and trackpad scrolling over the map provide granular zoom in and out, constrained to the full Brazil extent. Holding and dragging pans the current view; a click without dragging still selects the state. Do not provide region-selection buttons.
- A mouse wheel or touchpad scroll while over the map zooms in and out around the pointer, without scrolling the page.
- On page load, request browser geolocation when available. Resolve authorized coordinates through the existing Brazilian municipality endpoint, map the returned UF to its state, and zoom to it.
- Keep the full Brazil view available and make a denied, unavailable, or unresolved location non-blocking.
- Attribute the state-boundary source in accordance with its CC BY 4.0 license.
- Do not add climate alert markers, severity styling, or alert details in this stage; those belong to the next roadmap stage.
