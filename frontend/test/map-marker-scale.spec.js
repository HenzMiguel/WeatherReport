import { expect, test } from '@playwright/test';

test('scales alert markers inversely to map zoom', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: (_success, error) => error({ code: 1 }) },
    });
  });
  await page.route('**/api/v1/mapa/alertas', (route) =>
    route.fulfill({
      json: {
        atualizado_em: '2026-09-26T15:00:00.000Z',
        alertas: [
          {
            id: '18:4204202',
            titulo: 'Chuva intensa',
            nivel: 'EMERGENCIA',
            inicio: '2026-09-26T13:00:00.000Z',
            fim: '2026-09-27T21:00:00.000Z',
            descricao: '',
            instrucoes: [],
            cidade: 'Chapecó',
            uf: 'SC',
            latitude: -27.1,
            longitude: -52.6,
          },
        ],
      },
    }),
  );
  await page.goto('/#/mapa');
  const marker = page.getByRole('button', {
    name: 'Emergência: Chuva intensa, Chapecó, SC',
  });
  await expect(marker).toBeVisible();
  const fullScale = await marker.getAttribute('transform');
  await page
    .getByRole('button', { name: 'São Paulo, SP. Ampliar mapa neste estado.' })
    .click();
  await expect.poll(() => marker.getAttribute('transform')).not.toBe(fullScale);
  await expect(marker).toHaveAttribute('transform', /scale\(0\./);
});
