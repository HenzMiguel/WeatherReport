# Roadmap — Painel Administrativo

## Regra de execução

Implemente uma etapa por vez. Cada feature deve ter sua própria pasta em `features/`, com `requirements.md` e `validation.md` escritos em inglês. A próxima etapa só começa depois da validação da atual.

## Etapa 1 — Acesso administrativo

- [x] Disponibilizar entrada para administradores.
- [x] Restringir o conteúdo e as ações administrativas a usuários autorizados.
- [x] Informar claramente acessos negados ou sessões inválidas.

**Concluída quando:** somente administradores autenticados acessam o painel.

## Etapa 2 — Métricas e erros do sistema

- [x] Exibir quantidade de requisições ao longo do tempo.
- [x] Exibir quantidade de erros.
- [x] Exibir em gráficos a quantidade de requisições e de erros, o percentual de uso de CPU e a memória consumida.
- [x] Permitir consultar os erros gerados, com informações suficientes para identificação (data/hora, rota e status HTTP).

**Concluída quando:** as métricas e os erros gerados são apresentados de forma legível, com período de referência.

## Etapa 3 — Revisão da página

- [x] Validar controle de acesso, métricas e consulta aos erros gerados.
- [x] Revisar mensagens de sucesso, erro e ações sem permissão.
- [x] Registrar a validação de cada feature em seu respectivo `validation.md`.

**Concluída quando:** todas as features possuem requisitos e validações documentados e aprovados.
