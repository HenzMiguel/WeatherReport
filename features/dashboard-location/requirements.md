# Dashboard — Location

Implement roadmap stage 1 before starting stage 2. Keep all Brazilian municipalities supported by the provider; do not restrict searches to capitals.

- GET /cidades accepts a partial name, optional UF, page and limit. Require nome (at least two characters) or uf, rather than silently returning only capitals. Match accents and case insensitively; sort by name and UF before pagination.
- Use Radar Meteorologico's municipality catalogue (IBGE code, coordinates and time zone). Generate stable UUID v5 identifiers from IBGE codes, preserving the existing UUID contract.
- GET /localizacoes?latitude=...&longitude=... resolves browser coordinates with Nominatim, checks Brazil, then matches the municipality name and UF in the catalogue. Do not select a nearby capital or silently guess an unmatched municipality.
- Ask for browser geolocation only after an explicit button click. Explain that coordinates are sent to the location provider. Always allow manual search and confirmation of the inferred city.
- Cache Nominatim responses, identify the application, and serialize outgoing attempts at least 1.1 seconds apart. Configure the provider URL via environment.
- Return documented 400/404/503/500 errors. External requests use AbortController, timeout and retry with exponential backoff for network failures, timeout, 429 and 5xx. Propagate a correlation ID without logging credentials or exact GPS coordinates.
- Keep routes, controllers, services and repository separate. JWT integration is owned by another team member; the existing public city queries remain public until the shared contract is updated.

Sources: https://radarmeteorologico.com.br/api-publica ; https://nominatim.org/release-docs/latest/api/Reverse/ ; https://operations.osmfoundation.org/policies/nominatim/
