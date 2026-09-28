import { expect, test } from '@playwright/test';

const alerts = [
    {
        id: 'alerta-sc',
        titulo: 'Chuva intensa',
        nivel: 'ALERTA',
        inicio: '2026-09-26T13:00:00.000Z',
        fim: '2026-09-27T21:00:00.000Z',
        descricao: '',
        instrucoes: [],
        cidade: 'Chapecó',
        uf: 'SC',
        latitude: -27.1,
        longitude: -52.6,
    },
    {
        id: 'emergencia-sp',
        titulo: 'Alagamento',
        nivel: 'EMERGENCIA',
        inicio: '2026-09-26T13:00:00.000Z',
        fim: '2026-09-27T21:00:00.000Z',
        descricao: '',
        instrucoes: [],
        cidade: 'São Paulo',
        uf: 'SP',
        latitude: -23.5,
        longitude: -46.6,
    },
];

async function denyLocation(page) {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'geolocation', {
            value: {
                getCurrentPosition: (_success, error) => error({ code: 1 }),
            },
        });
    });
}

test('announces loading while alert data is pending', async ({ page }) => {
    await denyLocation(page);
    let release;
    const response = new Promise((resolve) => {
        release = resolve;
    });
    await page.route('**/api/v1/mapa/alertas', async (route) => {
        await response;
        await route.fulfill({
            json: {
                atualizado_em: '2026-09-27T00:00:00.000Z',
                alertas: alerts,
            },
        });
    });
    await page.goto('/#/mapa');
    await expect(
        page.getByText('Carregando alertas climáticos…'),
    ).toBeVisible();
    await expect(page.locator('.map-canvas')).toHaveAttribute(
        'aria-busy',
        'true',
    );
    release();
    await expect(page.locator('.map-canvas')).toHaveAttribute(
        'aria-busy',
        'false',
    );
});

test('filters alerts by severity and reports an empty selected area', async ({
    page,
}) => {
    await denyLocation(page);
    await page.route('**/api/v1/mapa/alertas', (route) =>
        route.fulfill({
            json: {
                atualizado_em: '2026-09-27T00:00:00.000Z',
                alertas: alerts,
            },
        }),
    );
    await page.goto('/#/mapa');
    const emergency = page.getByRole('button', {
        name: 'Emergência: Alagamento, São Paulo, SP',
    });
    await expect(emergency).toBeVisible();
    await page.getByRole('checkbox', { name: 'Emergência' }).uncheck();
    await expect(emergency).toHaveCount(0);
    await page.getByRole('checkbox', { name: 'Alerta' }).uncheck();
    await expect(
        page.getByText('Selecione ao menos uma severidade'),
    ).toBeVisible();
    await page.getByRole('checkbox', { name: 'Alerta' }).check();
    await page
        .getByRole('button', {
            name: 'São Paulo, SP. Ampliar mapa neste estado.',
        })
        .click();
    await expect(page.getByText('Não há alertas para São Paulo')).toBeVisible();
});

test('announces an unavailable alert request and retries it', async ({
    page,
}) => {
    await denyLocation(page);
    let attempts = 0;
    await page.route('**/api/v1/mapa/alertas', (route) => {
        attempts += 1;
        if (attempts <= 2)
            return route.fulfill({
                status: 503,
                json: { mensagem_erro: 'Indisponível' },
            });
        return route.fulfill({
            json: {
                atualizado_em: '2026-09-27T00:00:00.000Z',
                alertas: [alerts[0]],
            },
        });
    });
    await page.goto('/#/mapa');
    await expect(
        page.getByRole('alert').filter({
            hasText: 'Não foi possível carregar os alertas climáticos',
        }),
    ).toContainText('Não foi possível carregar os alertas climáticos');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(
        page.getByRole('button', {
            name: 'Alerta: Chuva intensa, Chapecó, SC',
        }),
    ).toBeVisible();
});
