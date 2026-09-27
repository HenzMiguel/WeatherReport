import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAlertService } from '../src/services/alerts.js';

const city = { codigo_ibge: '4204202', uf: 'SC' };
const validAlert = {
    id: 1,
    evento: 'Tempestade',
    nivel: 2,
    inicio: new Date(Date.now() - 60000).toISOString(),
    fim: new Date(Date.now() + 3600000).toISOString(),
    geocodes: [4204202],
    riscos: [],
    instrucoes: [],
};

test('does not cache a provider body that fails alert validation', async () => {
    let calls = 0;
    const alerts = createAlertService(async () => {
        calls++;
        return {
            alertas: [calls === 1 ? { ...validAlert, nivel: 9 } : validAlert],
        };
    });

    await assert.rejects(alerts(city, 'first'), { status: 503 });
    const result = await alerts(city, 'second');

    assert.equal(calls, 2);
    assert.equal(result.level, 'ALERTA');
    assert.equal(result.alerts.length, 1);
});
