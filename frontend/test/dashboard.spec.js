import { test, expect } from '@playwright/test';
const city = {
  id: 'be4dc32f-21f9-5864-a6a6-6c65f87b2cf8',
  nome: 'Chapecó',
  uf: 'SC',
  codigo_ibge: '4204202',
  latitude: -27.1,
  longitude: -52.6,
  fuso_horario: 'America/Sao_Paulo',
  nivel_risco: null,
};
function data() {
  return {
    cidade_id: city.id,
    nome: city.nome,
    uf: city.uf,
    fuso_horario: city.fuso_horario,
    atualizado_em: '2026-09-26T15:00:00Z',
    consultado_em: '2026-09-26T15:00:00Z',
    fonte: 'Open-Meteo',
    temperatura_hoje: 25,
    diferenca_temperatura_ontem: 2,
    nivel_risco_semana: 'NORMAL',
    risco_semana: {
      inicio: '2026-09-26T15:00:00Z',
      fim: '2026-10-03T15:00:00Z',
      alertas: [],
      cobertura: 'Somente avisos publicados.',
    },
    grafico_semanal: Array.from({ length: 8 }, (_, i) => ({
      data: '2026-09-' + (19 + i),
      temperatura: 20 + i / 2,
      parcial: i === 7,
      amostras: i === 7 ? 13 : 24,
    })),
    historico_24h: Array.from({ length: 24 }, (_, i) => ({
      horario: new Date(
        Date.parse('2026-09-25T16:00:00Z') + i * 3600000,
      ).toISOString(),
      temperatura: 20 + i / 5,
      media_movel: 20 + i / 6,
      media_referencia: 20,
      desvio: i / 5,
      z_score: i / 5,
      anomalia: i === 23,
    })),
    metodologia: {
      comparacao_ontem: 'Mesma hora de ontem.',
      grafico_semanal: 'Média diária.',
      media_movel: 'Três horas.',
      anomalias: 'Referência de sete dias; não é uma normal climatológica.',
    },
    avisos: [],
  };
}
async function select(page) {
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('Chapecó');
  await page.getByRole('button', { name: 'Buscar cidade' }).click();
  await page.getByRole('button', { name: 'Chapecó SC' }).click();
}
async function routes(page, forecast) {
  await page.route('**/api/v1/cidades?**', (route) =>
    route.fulfill({
      json: {
        dados: [city],
        paginacao: { pagina_atual: 1, total_paginas: 1, total_itens: 1 },
      },
    }),
  );
  await page.route('**/api/v1/cidades/*/previsao', forecast);
}
test('complete dashboard, charts and exact-value tables', async ({ page }) => {
  await routes(page, (route) => route.fulfill({ json: data() }));
  await select(page);
  await expect(
    page.getByRole('heading', { name: 'Uma semana de temperaturas' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'As últimas 24 horas' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Anomalias de temperatura' }),
  ).toBeVisible();
  await page
    .getByText('Ver valores das últimas 24 horas', { exact: true })
    .click();
  await expect(
    page.getByRole('table', { name: 'Histórico horário' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Sem avisos publicados' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/dashboard-desktop.png',
    fullPage: true,
  });
});
test('provider failure allows retry and loading is visible', async ({
  page,
}) => {
  let calls = 0;
  await routes(page, async (route) => {
    calls++;
    if (calls === 1)
      await route.fulfill({
        status: 503,
        json: { mensagem_erro: 'Serviço climático indisponível.' },
      });
    else {
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({ json: data() });
    }
  });
  await select(page);
  await expect(page.getByRole('alert')).toContainText(
    'Serviço climático indisponível',
  );
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('status')).toContainText('Consultando');
  await expect(
    page.getByRole('heading', { name: 'Uma semana de temperaturas' }),
  ).toBeVisible();
});
test('partial data and mobile layout are readable without page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const payload = data();
  payload.temperatura_hoje = null;
  payload.nivel_risco_semana = null;
  payload.avisos = ['Fonte de alertas indisponível.'];
  payload.historico_24h.forEach((p) => {
    p.temperatura = null;
    p.media_movel = null;
    p.anomalia = null;
  });
  await routes(page, (route) => route.fulfill({ json: payload }));
  await select(page);
  await expect(
    page.getByRole('heading', { name: 'Risco indisponível' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Dados insuficientes para identificar anomalias neste período.',
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/dashboard-mobile.png',
    fullPage: true,
  });
});

test('unreachable backend displays a clear connection message', async ({
  page,
}) => {
  await routes(page, (route) => route.abort('connectionfailed'));
  await select(page);
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível conectar ao servidor',
  );
});
