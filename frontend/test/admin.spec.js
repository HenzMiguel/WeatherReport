import { test, expect } from '@playwright/test';

test('administrative page authenticates before exposing protected content', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      json: {
        token_acesso: 'admin-token',
        tipo_token: 'Bearer',
        papel: 'ADMIN',
      },
    }),
  );
  await page.route('**/api/v1/admin/sessao', (route) =>
    route.fulfill({
      json: { email: 'admin@weatherreport.test', papel: 'ADMIN' },
    }),
  );
  await page.goto('/#/admin');
  await expect(
    page.getByRole('heading', { name: 'Acesso administrativo' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Painel administrativo' }),
  ).not.toBeVisible();
  await page.getByLabel('E-mail').fill('admin@weatherreport.test');
  await page.getByLabel('Senha').fill('senha-segura');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Painel administrativo' }),
  ).toBeVisible();
});

test('administrative page presents system metrics with a reference period', async ({
  page,
}) => {
  await page.route('**/api/v1/admin/sessao', (route) =>
    route.fulfill({
      json: { email: 'admin@weatherreport.test', papel: 'ADMIN' },
    }),
  );
  await page.route('**/api/v1/admin/metricas', (route) =>
    route.fulfill({
      json: {
        periodo: {
          inicio: '2026-09-27T11:00:00.000Z',
          fim: '2026-09-27T12:00:00.000Z',
          intervalo_segundos: 60,
        },
        total_requisicoes: 42,
        total_erros: 3,
        uso_cpu_porcentagem: 12.4,
        consumo_memoria_mb: 210.5,
        requisicoes_por_intervalo: Array.from({ length: 60 }, (_, index) => ({
          inicio: '2026-09-27T11:00:00.000Z',
          fim: '2026-09-27T11:01:00.000Z',
          quantidade: index % 4,
        })),
      },
    }),
  );
  await page.goto('/#/admin');
  await page.evaluate(() =>
    sessionStorage.setItem('weatherreport.admin-token', 'admin-token'),
  );
  await page.reload();
  await expect(page.getByText('Período de referência:')).toBeVisible();
  await expect(page.getByText('42', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Volume por minuto' }),
  ).toBeVisible();
});
