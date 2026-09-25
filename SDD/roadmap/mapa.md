# Roadmap — Mapa

## Regra de execução

Implemente uma etapa por vez. Cada feature deve ter sua própria pasta em `features/`, com `requirements.md` e `validation.md` escritos em inglês. A próxima etapa só começa depois da validação da atual.

## Etapa 1 — Recorte geográfico

- [ ] Apresentar o mapa do Brasil.
- [ ] Centralizar a visualização na região inferida pela localização do usuário quando disponível.
- [ ] Permitir selecionar manualmente uma região brasileira.

**Concluída quando:** o usuário visualiza o território brasileiro e consegue mudar a região de referência.

## Etapa 2 — Alertas climáticos

- [ ] Exibir alertas ativos como pontos no mapa.
- [ ] Diferenciar visualmente os pontos conforme a severidade.
- [ ] Mostrar detalhes do alerta ao selecionar um ponto.

**Concluída quando:** cada alerta ativo é identificável no mapa, com severidade e informações relevantes.

## Etapa 3 — Filtros e estados da página

- [ ] Permitir filtrar alertas por severidade.
- [ ] Informar quando não houver alertas para a área consultada.
- [ ] Tratar carregamento e indisponibilidade dos dados.

**Concluída quando:** filtros e mensagens de estado alteram a visualização de maneira correta.

## Etapa 4 — Revisão da página

- [ ] Validar a localização dos alertas, a severidade e os filtros.
- [ ] Revisar a legibilidade e a navegação no mapa.
- [ ] Registrar a validação de cada feature em seu respectivo `validation.md`.

**Concluída quando:** todas as features possuem requisitos e validações documentados e aprovados.
