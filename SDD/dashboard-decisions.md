# Dashboard — decisões de implementação

O escopo de roadmap/dashboard.md foi preservado. Este documento detalha decisões que o roadmap não especificava.

## Fontes e localização

- Radar Meteorológico: busca de municípios por nome/UF, coordenadas, código IBGE e fuso. Nenhuma restrição às capitais. Ao informar UF, filtramos a lista do estado localmente; sem UF, usamos a busca por nome do provedor.
- UUID v5 derivado do código IBGE mantém o formato de identificador original. O índice de cidades selecionáveis fica em memória; depois de reiniciar o backend, faça a busca novamente antes de consultar um UUID.
- Nominatim: converte coordenadas autorizadas pelo navegador em município/UF. O backend confirma esse nome no catálogo. País diferente de Brasil ou ausência de correspondência retorna 404, sem adivinhar a cidade.
- A geolocalização pode ser imprecisa; a interface pede confirmação. Consultas Nominatim usam cache de 24h, identificação da aplicação e intervalo mínimo de 1,1s entre tentativas. Apenas um processo de backend é previsto para a demonstração.

## Temperaturas e gráficos

- Atual: temperature_2m do bloco current do Open-Meteo; informação de modelo, não leitura de uma estação própria.
- Ontem: temperatura atual menos temperatura horária na mesma hora local do dia anterior (hora atual arredondada para baixo).
- Semanal: oito datas, de hoje até sete dias atrás. Médias de valores horários disponíveis; hoje é parcial e nenhuma hora futura entra no cálculo.
- 24 horas: 24 slots horários consecutivos até a hora da atualização. Lacunas permanecem nulas.
- Média móvel: média da hora e das duas horas anteriores; as três precisam existir.
- Anomalia estatística: comparar cada hora com as sete amostras no mesmo horário dos sete dias anteriores. Exigir desvio absoluto de pelo menos 2 °C e módulo do z-score de pelo menos 2, usando desvio padrão populacional. Se a variância for zero, basta o desvio de 2 °C. Referência insuficiente produz null. Esta análise não é uma normal climatológica e a interface explica isso.
- Oito dias anteriores são solicitados para dar referência suficiente ao começo da janela de 24h.

## Risco e avisos

Usar avisos publicados pelo INMET, distribuídos pelo Radar Meteorológico, que incluam o código IBGE selecionado e intersectem agora até sete dias à frente. Níveis 1/2/3 viram ATENCAO/ALERTA/EMERGENCIA. Datas sem offset da fonte são interpretadas em Brasília, UTC-03:00. O maior nível define o resumo.

NORMAL significa apenas nenhum aviso publicado encontrado, não ausência garantida de risco. Falha na fonte resulta em risco null e mensagem de indisponibilidade, preservando o clima disponível. Não inventamos alertas ou refletividade de radar; o campo original refletividade_radar_dbz permanece opcional no contrato e não é preenchido.

## Resiliência e persistência

Até três tentativas por consulta externa. Timeout de 8 segundos por tentativa via AbortController; espera de 500ms e 1000ms entre tentativas. Retry para erros de rede, timeout, HTTP 429 e 5xx; outros 4xx e JSON inválido não são repetidos. Exaustão vira 503 padronizado. Uma falha apenas de alertas é a exceção documentada: 200 parcial com aviso e risco null.

Clima/avisos: cache de 10 minutos. Municípios/geolocalização: 24 horas. Respostas climáticas processadas são persistidas em backend/data como JSON, ignorado pelo Git; dados expirados não são apresentados como atuais. Falhas de persistência são registradas sem derrubar uma consulta climática válida. Um X-Correlation-Id acompanha logs e consultas externas. Logs não registram token nem coordenadas GPS completas.

## Integração da equipe

As consultas do dashboard continuam públicas como no contrato original. O colega de autenticação precisa implementar login/JWT e combinar no Swagger quais rotas serão protegidas. O frontend já aceita a prop token e envia Authorization: Bearer. Não há login fictício nem bypass de um middleware existente.

Login e métricas aparecem no Swagger por serem parte do contrato da equipe; ainda não são implementados neste backend. Mapa, rankings e criação administrativa de alertas também ficam com os responsáveis. Alertas oficiais do dashboard não dependem da futura criação manual de alertas.

## Documentação das fontes

- https://open-meteo.com/en/docs
- https://radarmeteorologico.com.br/api-publica
- https://nominatim.org/release-docs/latest/api/Reverse/
- https://operations.osmfoundation.org/policies/nominatim/
