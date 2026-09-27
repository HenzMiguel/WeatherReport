# Validation — Geographic scope

Technical validation completed on 2026-09-26.

- PASS: the initial map renders Brazil with individually identifiable boundaries for all 26 states and the Federal District.
- PASS: clicking São Paulo, or using the same state control by keyboard, selects and zooms the map; mouse-wheel/trackpad scrolling over the map changes the SVG viewBox in granular steps, anchored at the pointer, and zooming out restores the full-Brazil extent. Holding and dragging pans the enlarged map without triggering a state selection.
- PASS: mouse wheel or touchpad scrolling over the map zooms around the pointer. The browser test verifies that the SVG viewBox changes after a wheel gesture.
- PASS: authorized browser coordinates resolve through the municipality endpoint and zoom to the returned state; a Chapecó, SC response selects Santa Catarina.
- PASS: unavailable or denied location leaves the state map usable and announces a clear fallback.
- PASS: the state-boundary source is attributed in the interface under CC BY 4.0.
- PASS: production build and nine Playwright browser scenarios pass in Edge headless.

Evidence: `frontend/test/map.spec.js`. No alert markers, severity UI, or alert details are included; they remain roadmap stage 2.
