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
test('manual non-capital search and city selection', async ({ page }) => {
  await page.route('**/api/v1/cidades?**', (route) =>
    route.fulfill({
      json: {
        dados: [city],
        paginacao: { pagina_atual: 1, total_paginas: 1, total_itens: 1 },
      },
    }),
  );
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('Chapecó');
  await page.getByLabel('Estado', { exact: true }).selectOption('SC');
  await page.getByRole('button', { name: 'Buscar cidade' }).click();
  await expect(page.getByRole('button', { name: 'Chapecó SC' })).toBeVisible();
});
test('denied geolocation keeps manual search available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: (success, error) => error({ code: 1 }) },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Usar minha localização' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Permissão de localização negada',
  );
  await expect(page.getByLabel('Cidade', { exact: true })).toBeEnabled();
});
test('GPS result asks for confirmation and displays inferred municipality', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -27.1, longitude: -52.6 });
  await page.route('**/api/v1/localizacoes?**', (route) =>
    route.fulfill({
      json: {
        cidade: city,
        fonte: 'Nominatim',
        mensagem: 'Confira a cidade identificada.',
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Usar minha localização' }).click();
  await expect(page.getByRole('status')).toContainText('Confira');
  await expect(page.getByRole('button', { name: 'Chapecó SC' })).toBeVisible();
});
