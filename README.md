![Capa](./WeatherReport.png)

# WeatherReport

Aplicação que reúne dados climáticos, apresentando avisos de perigo e estatísticas básicas. Para o Brasil

# Páginas principais:

Boa parte das funcionalidades descritas abaixo estarão no final do projeto. Porém algumas podem estar sujeita a mudanças.

## Visão do usúario:

### Dashboard           
- Temperatura atual
- avisos metereológicos
- Temperatura de hoje comparado a 7 dias

### Mapa          
- Alertas com cidade, estado
- Cobre o brasil inteiro
- Pesquisa manual por cidade

### Rankings


## Adminstrador do sistema:

### Dashboard
            
- Quantidades de requisições ao longo do tempo
- Quantidade de erros
- Porcentagem da CPU utilizada
- Memória consumida

# Integrantes

Arthur Wiederkehr, João Perinotti e Miguel Henz

# Executar o dashboard localmente

Esta branch implementa o dashboard completo, com React/Vite e uma API Express. Login/JWT, mapa, painel administrativo e rankings são responsabilidade das outras partes da equipe. As rotas de login e métricas do Swagger ainda não têm implementação aqui.

## Requisitos e início

1. Instale Node.js 22.19 ou mais recente (testado com Node 24).
2. Abra o terminal na pasta que contém este README e package.json.
3. Execute npm install na primeira utilização.
4. Execute npm run dev e mantenha o terminal aberto.
5. Abra http://127.0.0.1:5173 para o dashboard.
6. Abra http://127.0.0.1:3000/api/docs para o Swagger interativo.

Não são necessárias chaves de API. Para encerrar, pressione Ctrl+C no terminal. O frontend usa um proxy local para a API na porta 3000. npm run build gera frontend/dist; npm start inicia apenas o backend.

Os comandos do backend usam --use-system-ca para respeitar os certificados confiáveis do sistema, sem desabilitar TLS. Se o npm apresentar UNABLE_TO_VERIFY_LEAF_SIGNATURE no Windows, configure apenas a sessão PowerShell com:

    $env:NODE_OPTIONS='--use-system-ca'
    npm install

## Como rodar

AUTH_SECRET="$(openssl rand -hex 32)" npm run dev

## Docker

Com Docker Compose instalado, execute:

    docker compose up --build

O dashboard fica disponível em http://localhost:5173 e a documentação da API em
http://localhost:3000/api/docs. O volume `weather-data` preserva o histórico
processado entre reinicializações. Para ativar o acesso administrativo, defina
`AUTH_SECRET` no ambiente antes de iniciar os contêineres.

## Verificações

    npm run validate:contract
    npm test
    npm run test:ui
    npm run build

Os testes de interface usam o Microsoft Edge instalado em modo headless. Em outro sistema, ajuste channel no playwright.config.js ou instale o navegador correspondente. A suíte da interface simula respostas para validar inclusive falhas; a aplicação normal sempre usa as fontes reais.

## Organização

- backend/src/routes: URLs da API.
- backend/src/controllers: parâmetros, respostas e middlewares compartilhados.
- backend/src/services: integração externa, transformação, risco e cálculos.
- backend/src/repositories: cache, catálogo consultado e persistência JSON.
- frontend/src/pages/Dashboard.jsx: página principal, que recebe uma prop token para integração futura com login.
- frontend/src/components: busca e gráfico reutilizável.
- frontend/src/services/api.js: cliente da API, com suporte a Bearer token.
- features: requisitos e evidências de validação em inglês, por etapa.
- SDD/dashboard-decisions.md: fórmulas, fontes, limites e pontos de integração.

O histórico processado é salvo automaticamente em backend/data/*.json, fora do versionamento. Após reiniciar a API, busque a cidade novamente para repopular o índice local de UUIDs. Dados de cache expirados não são apresentados como atuais. Falha apenas na fonte de alertas preserva temperaturas, mas mostra risco indisponível.

Para habilitar o acesso administrativo, copie `admin.example.txt` para `admins.txt`, cadastre um administrador por linha no formato `email:senha` e configure `AUTH_SECRET` com um segredo longo e aleatório. `admins.txt` é ignorado pelo Git e nunca deve ser versionado. URLs dos provedores podem ser configuradas por variáveis de ambiente RADAR_BASE_URL, OPEN_METEO_BASE_URL e NOMINATIM_BASE_URL. DATA_DIR altera a pasta de persistência. PORT altera a API, mas exige ajustar também o proxy do Vite. Os padrões atendem à execução local sem configuração.
