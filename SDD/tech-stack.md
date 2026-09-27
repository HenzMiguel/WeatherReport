# Tech Stack

# Style of code
Tabs must be 4 spaces. There needs to be 1 new line between groups of codes that do different things. Put comments in functions with lots of steps.

# Frontend
- React/js with vite

# Backend

- Express/js with node.
- Authentication with JWT
- http status code with a library to have readable codes instead of numbers. Ex: http_status_not_found instead of 404

## Arquitetura

A arquitetura deve ser feita com as seguintes camadas:
- routes
- controllers
- services
- repository

controllers deve ter um arquivo com middlewares. Persistência tanto em memória para cachear repostas recentes da API e em JSON para históricos que gŕaficos e tabelas que utilizam.

# APIS
- https://radarmeteorologico.com.br/api-publica
- https://open-meteo.com/
