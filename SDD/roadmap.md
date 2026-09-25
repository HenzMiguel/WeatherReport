# Roadmap — WeatherReport

## Processo obrigatório de implementação

As etapas devem ser implementadas estritamente uma por vez, respeitando a ordem do roadmap. Uma nova etapa só pode começar depois que a etapa atual tiver sido validada e concluída.

Cada feature deve possuir uma pasta própria dentro de `features/`, usando um nome descritivo em `kebab-case`. Antes de implementar a feature, a pasta deve conter:

- `requirements.md`: requisitos funcionais e não funcionais da feature, escritos em inglês.
- `validation.md`: estratégia, cenários e evidências da validação utilizada, escritos em inglês.

Exemplo:

```text
features/
└── city-weather/
    ├── requirements.md
    └── validation.md
```

Fluxo obrigatório para cada feature:

1. Criar a pasta da feature.
2. Especificar os requisitos em `requirements.md`.
3. Definir a validação em `validation.md`.
4. Implementar somente essa feature.
5. Executar a validação e registrar os resultados em `validation.md`.
6. Marcar a feature como concluída apenas quando todos os requisitos forem atendidos.

### Definition of Done da etapa

- Todas as features da etapa possuem sua própria pasta.
- Cada pasta contém os dois arquivos obrigatórios em inglês.
- Os requisitos funcionais e não funcionais foram atendidos.
- A validação definida foi executada e os resultados foram registrados.
- A etapa foi concluída antes do início da próxima.

## Etapa 1 — Fundação do projeto

**Objetivo:** deixar o ambiente pronto para desenvolvimento consistente.

- [ ] Definir o escopo detalhado do MVP e os fluxos prioritários.
- [ ] Criar o ambiente inicial de desenvolvimento e um fluxo de execução local.
- [ ] Definir padrões de qualidade, tratamento de erros e rastreabilidade.
- [ ] Documentar como instalar, configurar e executar o projeto no README.

**Critério de aceite:** o sistema inicia localmente, responde ao health check e apresenta mensagens padronizadas para operações inválidas.

## Etapa 2 — Dados climáticos e cidades

**Objetivo:** integrar a fonte externa e oferecer dados confiáveis para as telas.

- [ ] Validar a cobertura dos dados meteorológicos para as regiões e cidades brasileiras do MVP.
- [ ] Integrar a fonte meteorológica definida no projeto, com tratamento de indisponibilidade.
- [ ] Disponibilizar cidades brasileiras com busca, filtros por estado/região e paginação.
- [ ] Disponibilizar previsão da cidade, incluindo transformação dos dados externos e cálculo de risco.
- [ ] Registrar falhas de integração e evitar consultas duplicadas desnecessárias.
- [ ] Disponibilizar histórico de 24 h, média móvel e anomalias.

**Critério de aceite:** uma cidade válida exibe previsão, risco e histórico; uma indisponibilidade da fonte de dados é comunicada claramente ao usuário.

## Etapa 3 — Autenticação e autorização

**Objetivo:** separar as permissões de usuário e administrador.

- [ ] Implementar cadastro e login de usuários.
- [ ] Garantir cadastro e autenticação segura para usuários e administradores.
- [ ] Separar permissões de usuário e administrador.
- [ ] Proteger as operações administrativas e validar acessos permitidos e negados.

**Critério de aceite:** usuários autenticados acessam suas funcionalidades, e somente administradores criam alertas e consultam as métricas do sistema.

## Etapa 4 — Experiência principal do usuário

**Objetivo:** entregar a consulta climática em estilo preto e branco, com interface simples.

- [ ] Criar layout e navegação para Dashboard, Mapa, Rankings e tela de cidade.
- [ ] Implementar busca manual por cidade/estado e geolocalização via GPS com alternativa manual caso a permissão seja negada.
- [ ] Exibir temperatura atual, diferença em relação ao dia anterior, risco semanal e gráficos da última semana.
- [ ] Criar tela de cidade com histórico de 24 h, média móvel, anomalias e alertas.
- [ ] Tratar carregamento, ausência de dados e erros de integração de maneira clara.

**Critério de aceite:** uma pessoa consegue localizar ou buscar uma cidade, consultar seus dados e entender o nível de risco sem usar ferramentas de desenvolvimento.

## Etapa 5 — Alertas e administração

**Objetivo:** tornar alertas e saúde operacional visíveis e administráveis.

- [ ] Disponibilizar alertas com filtro por severidade no dashboard e no mapa.
- [ ] Permitir que administradores publiquem alertas sem duplicação.
- [ ] Coletar totais de requisições, erros, CPU e memória.
- [ ] Criar dashboard administrativo com as métricas do sistema.
- [ ] Garantir rastreabilidade das operações e consultas relevantes.

**Critério de aceite:** o administrador publica um alerta sem duplicação e visualiza as métricas atualizadas; usuários não possuem acesso a essas ações.

## Etapa 6 — Mapa e rankings

**Objetivo:** ampliar a leitura geográfica e comparativa do clima.

- [ ] Exibir no mapa o Brasil, com a região inferida por GPS ou selecionada manualmente.
- [ ] Representar alertas como pontos com intensidade visual proporcional à severidade.
- [ ] Criar rankings por estado e cidade do Brasil: mais/menos quente, mais úmido, anomalias e tendências.
- [ ] Definir e documentar as fórmulas usadas nos rankings para que sejam reproduzíveis.

**Critério de aceite:** o mapa comunica os alertas por localização e os rankings mostram dados, período de referência e critérios de cálculo.

## Etapa 7 — Qualidade e entrega

**Objetivo:** preparar uma versão demonstrável, estável e documentada.

- [ ] Criar testes unitários para serviços de risco, anomalia, autenticação e autorização.
- [ ] Criar testes de integração para os fluxos principais do produto.
- [ ] Validar os fluxos principais no navegador, incluindo geolocalização negada e API externa indisponível.
- [ ] Revisar acessibilidade básica, responsividade e mensagens de erro.
- [ ] Atualizar README, contrato da API e documentação do produto.

**Critério de aceite:** os testes definidos passam, os fluxos críticos foram verificados manualmente e a documentação permite que outra pessoa execute o projeto.

## Ordem de entrega sugerida

| Marco | Etapas | Resultado demonstrável |
| --- | --- | --- |
| M1 — Base técnica | 1 e 2 | Consulta de cidades, previsão e histórico com integração externa |
| M2 — MVP funcional | 3 e 4 | Consulta climática completa com login e interface principal |
| M3 — Operação | 5 | Alertas administráveis e painel de métricas |
| M4 — Evolução e fechamento | 6 e 7 | Mapa, rankings, testes e documentação final |

## Fora do escopo inicial

- Notificações por e-mail, SMS ou push.
- Previsões produzidas por modelo meteorológico próprio.
