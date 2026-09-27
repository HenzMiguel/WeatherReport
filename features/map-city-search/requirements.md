# Map — City search

- Let people search the Brazilian municipality catalogue by city name and optional UF from the map page.
- Selecting a search result must center the map on that municipality's coordinates, render a distinct selected-city marker, filter alerts to its state, and announce the selected municipality and UF.
- The map search must not request browser geolocation; it is a deliberate manual selection.
- Keep search errors, empty results, keyboard access, and pagination behavior consistent with the shared city-search component.
