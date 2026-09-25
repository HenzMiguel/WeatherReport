# Roadmap — Dashboard

## Regra de execução

Implemente uma etapa por vez. Cada feature deve ter sua própria pasta em `features/`, com `requirements.md` e `validation.md` escritos em inglês. A próxima etapa só começa depois da validação da atual.

## Etapa 1 — Consulta de localização

- [ ] Obter a localização do usuário mediante permissão.
- [ ] Oferecer busca manual por cidade e estado como alternativa.
- [ ] Informar claramente quando a localização ou os dados não estiverem disponíveis.

**Concluída quando:** o usuário consegue definir uma cidade brasileira por localização ou busca manual.

## Etapa 2 — Resumo do clima

- [ ] Exibir a temperatura atual da cidade selecionada.
- [ ] Exibir a diferença entre a temperatura de hoje e a do dia anterior.
- [ ] Exibir o risco climático da semana quando existir.

**Concluída quando:** o resumo apresenta dados da cidade selecionada e um estado claro para ausência de dados.

## Etapa 3 — Histórico e gráficos

- [ ] Exibir gráfico de temperatura do dia atual até uma semana anterior.
- [ ] Exibir histórico de 24 horas, média móvel e anomalias da cidade.
- [ ] Apresentar carregamento e falhas de consulta de forma compreensível.

**Concluída quando:** os gráficos e indicadores correspondem à cidade selecionada e ao período informado.

## Etapa 4 — Revisão da página

- [ ] Validar busca, localização, resumo climático e gráficos.
- [ ] Revisar a interface preto e branco e a legibilidade em telas menores.
- [ ] Registrar a validação de cada feature em seu respectivo `validation.md`.

**Concluída quando:** todas as features possuem requisitos e validações documentados e aprovados.
