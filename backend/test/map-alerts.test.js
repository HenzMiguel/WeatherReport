import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMapAlertService } from '../src/services/map-alerts.js';

test('map alerts return active municipality points with alert details', async () => {
    const now = Date.parse('2026-09-26T15:00:00Z');
    const service = createMapAlertService({
        cities: {
            search: async ({ uf }) =>
                uf === 'SC'
                    ? [
                          {
                              codigo_ibge: '4204202',
                              nome: 'Chapecó',
                              uf: 'SC',
                              latitude: -27.1,
                              longitude: -52.6,
                          },
                      ]
                    : [],
        },
        requestJson: async (url) =>
            url.searchParams.get('uf') === 'SC'
                ? {
                      alertas: [
                          {
                              id: 18,
                              evento: 'Chuva intensa',
                              nivel: 3,
                              inicio: '2026-09-26 10:00',
                              fim: '2026-09-27 18:00',
                              geocodes: [4204202],
                              riscos: ['Alagamentos.'],
                              instrucoes: ['Evite áreas alagadas.'],
                          },
                      ],
                  }
                : { alertas: [] },
    });
    const result = await service('trace', now);
    assert.equal(result.alertas.length, 1);
    assert.deepEqual(result.alertas[0], {
        id: '18:4204202',
        alerta_id: '18',
        titulo: 'Chuva intensa',
        nivel: 'EMERGENCIA',
        inicio: '2026-09-26T13:00:00.000Z',
        fim: '2026-09-27T21:00:00.000Z',
        descricao: 'Alagamentos.',
        instrucoes: ['Evite áreas alagadas.'],
        cidade: 'Chapecó',
        uf: 'SC',
        latitude: -27.1,
        longitude: -52.6,
    });
});
