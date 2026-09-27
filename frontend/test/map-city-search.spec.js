import { expect, test } from '@playwright/test';

test('searches for a city and uses its state as the map reference', async ({
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
            json: { atualizado_em: '2026-09-27T00:00:00.000Z', alertas: [] },
        }),
    );
    await page.route('**/api/v1/cidades?**', (route) =>
        route.fulfill({
            json: {
                dados: [
                    {
                        id: 'city-1',
                        nome: 'Chapecó',
                        uf: 'SC',
                        latitude: -27.1,
                        longitude: -52.6,
                    },
                ],
                paginacao: {
                    pagina_atual: 1,
                    total_paginas: 1,
                    total_itens: 1,
                },
            },
        }),
    );
    await page.goto('/#/mapa');
    await page.getByRole('textbox', { name: 'Cidade' }).fill('Chapecó');
    await page.getByRole('button', { name: 'Buscar cidade →' }).click();
    await page.getByRole('button', { name: /Chapecó SC/ }).click();
    await expect(
        page.getByText('Chapecó, SC: cidade selecionada no mapa.'),
    ).toBeVisible();
    await expect(
        page.getByRole('img', {
            name: 'Mapa do Brasil ampliado no estado Santa Catarina',
        }),
    ).toBeVisible();
    await expect(
        page.getByRole('img', { name: 'Cidade selecionada: Chapecó, SC' }),
    ).toBeVisible();
});
