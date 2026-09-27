import { expect, test } from '@playwright/test';

test('keeps a coastal alert marker inside its state contour', async ({
    page,
}) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'geolocation', {
            value: {
                getCurrentPosition: (_success, error) => error({ code: 1 }),
            },
        });
    });
    await page.route('**/api/v1/mapa/alertas', (route) =>
        route.fulfill({
            json: {
                atualizado_em: '2026-09-26T15:00:00.000Z',
                alertas: [
                    {
                        id: 'rio',
                        titulo: 'Ressaca',
                        nivel: 'ALERTA',
                        inicio: '2026-09-26T13:00:00.000Z',
                        fim: '2026-09-27T21:00:00.000Z',
                        descricao: '',
                        instrucoes: [],
                        cidade: 'Rio de Janeiro',
                        uf: 'RJ',
                        latitude: -22.91,
                        longitude: -43.17,
                    },
                ],
            },
        }),
    );
    await page.goto('/#/mapa');
    await expect(
        page.getByRole('button', {
            name: 'Alerta: Ressaca, Rio de Janeiro, RJ',
        }),
    ).toBeVisible();
    await expect
        .poll(() =>
            page.locator('.map-alert-point').evaluate((marker) => {
                const [, x, y] = marker
                    .getAttribute('transform')
                    .match(/translate\(([^ ]+) ([^)]+)\)/);
                return document
                    .querySelector('[data-state="rj"]')
                    .isPointInFill(new DOMPoint(Number(x), Number(y)));
            }),
        )
        .toBe(true);
});
