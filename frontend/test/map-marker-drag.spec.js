import { expect, test } from '@playwright/test';

test('dragging an alert marker pans the map without selecting it', async ({
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
                        id: '18:4204202',
                        titulo: 'Chuva intensa',
                        nivel: 'EMERGENCIA',
                        inicio: '2026-09-26T13:00:00.000Z',
                        fim: '2026-09-27T21:00:00.000Z',
                        descricao: 'Alagamentos.',
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
    await page
        .getByRole('button', {
            name: 'Santa Catarina, SC. Ampliar mapa neste estado.',
        })
        .click();
    const marker = page.getByRole('button', {
        name: 'Emergência: Chuva intensa, Chapecó, SC',
    });
    const box = await marker.boundingBox();
    const map = page.getByRole('img', {
        name: 'Mapa do Brasil ampliado no estado Santa Catarina',
    });
    const before = await map.getAttribute('viewBox');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
        box.x + box.width / 2 + 45,
        box.y + box.height / 2 + 25,
    );
    await page.mouse.up();
    await expect.poll(() => map.getAttribute('viewBox')).not.toBe(before);
    await expect(
        page.getByRole('heading', { name: 'Chuva intensa' }),
    ).not.toBeVisible();
});
