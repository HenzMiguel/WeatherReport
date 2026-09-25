# Roadmap — Painel Administrativo

## Regra de execução

Implemente uma etapa por vez. Cada feature deve ter sua própria pasta em `features/`, com `requirements.md` e `validation.md` escritos em inglês. A próxima etapa só começa depois da validação da atual.

## Etapa 1 — Acesso administrativo

- [ ] Disponibilizar entrada para administradores.
- [ ] Restringir o conteúdo e as ações administrativas a usuários autorizados.
- [ ] Informar claramente acessos negados ou sessões inválidas.

**Concluída quando:** somente administradores autenticados acessam o painel.

## Etapa 2 — Métricas do sistema

- [ ] Exibir quantidade de requisições ao longo do tempo.
- [ ] Exibir quantidade de erros.
- [ ] Exibir percentual de uso de CPU e memória consumida.

**Concluída quando:** as métricas são apresentadas de forma legível, com período de referência.

## Etapa 3 — Gestão de alertas

- [ ] Permitir criar alertas climáticos para cidades brasileiras.
- [ ] Exigir título, severidade e descrição ao criar um alerta.
- [ ] Informar confirmação, erro ou duplicidade da operação.

**Concluída quando:** um administrador publica um alerta válido e ele fica disponível para consulta.

## Etapa 4 — Revisão da página

- [ ] Validar controle de acesso, métricas e criação de alertas.
- [ ] Revisar mensagens de sucesso, erro e ações sem permissão.
- [ ] Registrar a validação de cada feature em seu respectivo `validation.md`.

**Concluída quando:** todas as features possuem requisitos e validações documentados e aprovados.
