# Roadmap — Rankings

## Regra de execução

Implemente uma etapa por vez. Cada feature deve ter sua própria pasta em `features/`, com `requirements.md` e `validation.md` escritos em inglês. A próxima etapa só começa depois da validação da atual.

## Etapa 1 — Critérios dos rankings

- [ ] Definir os critérios e o período de referência para cada ranking.
- [ ] Documentar como são identificados maior e menor temperatura, umidade, anomalias e tendências.
- [ ] Indicar quando não houver dados suficientes para um resultado.

**Concluída quando:** cada ranking possui critério de cálculo e período de referência documentados.

## Etapa 2 — Rankings climáticos

- [ ] Exibir estado e cidade mais quentes e mais frios do Brasil.
- [ ] Exibir estado e cidade mais úmidos e menos úmidos do Brasil.
- [ ] Exibir anomalias e tendências climáticas identificadas.

**Concluída quando:** os rankings mostram resultado, período de referência e localidade brasileira correspondente.

## Etapa 3 — Navegação e estados da página

- [ ] Permitir alternar entre rankings de estados e cidades.
- [ ] Exibir a data ou período de atualização dos dados.
- [ ] Tratar ausência de dados, carregamento e falhas de consulta.

**Concluída quando:** o usuário consegue compreender e comparar os rankings sem ambiguidade.

## Etapa 4 — Revisão da página

- [ ] Validar os cálculos com dados de referência conhecidos.
- [ ] Revisar a apresentação das comparações e tendências.
- [ ] Registrar a validação de cada feature em seu respectivo `validation.md`.

**Concluída quando:** todas as features possuem requisitos e validações documentados e aprovados.
