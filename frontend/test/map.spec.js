import { expect, test } from '@playwright/test';

test('shows a state-accurate Brazil map and zooms on a clicked state', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: (_success, error) => error({ code: 1 }) },
    });
  });
  await page.goto('/#/mapa');
  await expect(
    page.getByRole('heading', { name: 'Alertas no território brasileiro' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', {
      name: 'Mapa do Brasil com os 26 estados e o Distrito Federal',
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'São Paulo, SP. Ampliar mapa neste estado.' })
    .click();
  await expect(page.getByRole('status')).toContainText('São Paulo, SP');
  await expect(
    page.getByRole('img', {
      name: 'Mapa do Brasil ampliado no estado São Paulo',
    }),
  ).toBeVisible();
  const map = page.getByRole('img', {
    name: 'Mapa do Brasil ampliado no estado São Paulo',
  });
  const beforeWheelZoom = await map.getAttribute('viewBox');
  const bounds = await map.boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.wheel(0, -150);
  await expect
    .poll(() => map.getAttribute('viewBox'))
    .not.toBe(beforeWheelZoom);
  const beforeDrag = await map.getAttribute('viewBox');
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 60,
    bounds.y + bounds.height / 2 + 30,
  );
  await page.mouse.up();
  await expect.poll(() => map.getAttribute('viewBox')).not.toBe(beforeDrag);
  await page.getByRole('button', { name: 'Ver Brasil inteiro' }).click();
  await expect(page.getByRole('status')).toContainText(
    'todo o território brasileiro',
  );
});
test('zooms on the state inferred from an authorized location', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -27.1, longitude: -52.6 });
  await page.route('**/api/v1/localizacoes?**', (route) =>
    route.fulfill({ json: { cidade: { nome: 'Chapecó', uf: 'SC' } } }),
  );
  await page.goto('/#/mapa');
  await expect(page.getByRole('status')).toContainText('Chapecó, SC');
  await expect(
    page.getByRole('img', {
      name: 'Mapa do Brasil ampliado no estado Santa Catarina',
    }),
  ).toBeVisible();
});
