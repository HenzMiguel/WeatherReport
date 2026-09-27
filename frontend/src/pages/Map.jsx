import React, { useEffect, useRef, useState } from 'react';
import brazil from '@svg-country-maps/brazil';
import { getJson } from '../services/api';
import SiteNavigation from '../components/SiteNavigation';
import LocationSearch from '../components/LocationSearch';
import MapAlertLayer, { AlertLegend } from '../components/MapAlertLayer';

const stateUfs = {
    ac: 'AC',
    al: 'AL',
    ap: 'AP',
    am: 'AM',
    ba: 'BA',
    ce: 'CE',
    df: 'DF',
    es: 'ES',
    go: 'GO',
    ma: 'MA',
    mt: 'MT',
    ms: 'MS',
    mg: 'MG',
    pa: 'PA',
    pb: 'PB',
    pr: 'PR',
    pe: 'PE',
    pi: 'PI',
    rj: 'RJ',
    rn: 'RN',
    rs: 'RS',
    ro: 'RO',
    rr: 'RR',
    sc: 'SC',
    sp: 'SP',
    se: 'SE',
    to: 'TO',
};
const stateByUf = (uf) =>
    brazil.locations.find((state) => stateUfs[state.id] === uf);
const severityFilters = [
    { value: 'ALERTA', label: 'Alerta' },
    { value: 'EMERGENCIA', label: 'Emergência' },
];
function zoomBox(path) {
    const { x, y, width, height } = path.getBBox();
    const padding = Math.max(width, height) * 0.6 + 8;
    return `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`;
}
function parseViewBox(value) {
    const [x, y, width, height] = value.split(' ').map(Number);
    return { x, y, width, height };
}
function mapPosition({ latitude, longitude }) {
    return {
        x: ((longitude + 74) / 40) * 613,
        y: ((5.5 - latitude) / 39.5) * 639,
    };
}
function cityViewBox(city) {
    const full = parseViewBox(brazil.viewBox);
    const point = mapPosition(city);
    const width = 180;
    const height = (width * full.height) / full.width;
    const x = Math.min(
        Math.max(point.x - width / 2, full.x),
        full.x + full.width - width,
    );
    const y = Math.min(
        Math.max(point.y - height / 2, full.y),
        full.y + full.height - height,
    );
    return [x, y, width, height].join(' ');
}
function CityReferenceMarker({ city, scale }) {
    if (
        !city ||
        !Number.isFinite(city.latitude) ||
        !Number.isFinite(city.longitude)
    )
        return null;
    const point = mapPosition(city);
    const label = `Cidade selecionada: ${city.nome}, ${city.uf}`;
    return (
        <g
            className="map-city-reference"
            transform={`translate(${point.x} ${point.y}) scale(${scale})`}
            role="img"
            aria-label={label}
        >
            <title>{label}</title>
            <circle className="map-city-reference-ring" r="10" />
            <circle className="map-city-reference-core" r="4" />
        </g>
    );
}
function BrazilMap({
    selected,
    onSelect,
    alerts,
    selectedAlert,
    onAlertSelect,
    selectedCity,
}) {
    const svg = useRef(null);
    const [viewBox, setViewBox] = useState(brazil.viewBox);
    const [dragging, setDragging] = useState(false);
    const drag = useRef(null);
    const didDrag = useRef(false);
    const markerScale = Math.min(
        1,
        parseViewBox(viewBox).width / parseViewBox(brazil.viewBox).width,
    );
    useEffect(() => {
        // Prefer the selected municipality's coordinates; otherwise fit the selected state.
        if (selectedCity) {
            setViewBox(cityViewBox(selectedCity));
            return;
        }
        if (!selected) {
            setViewBox(brazil.viewBox);
            return;
        }
        const path = svg.current?.querySelector(
            `[data-state="${selected.id}"]`,
        );
        if (path) setViewBox(zoomBox(path));
    }, [selected, selectedCity]);
    function wheelZoom(event) {
        // Keep the pointer's geographic position stable while changing the viewport.
        event.preventDefault();
        const bounds = svg.current.getBoundingClientRect();
        const current = parseViewBox(viewBox);
        const focus = {
            x: (event.clientX - bounds.left) / bounds.width,
            y: (event.clientY - bounds.top) / bounds.height,
        };
        const zoomIn = event.deltaY < 0;
        const scale = zoomIn ? 0.82 : 1.22;
        const full = parseViewBox(brazil.viewBox);
        if (
            !zoomIn &&
            (current.width * scale >= full.width ||
                current.height * scale >= full.height)
        ) {
            setViewBox(brazil.viewBox);
            return;
        }
        const width = Math.max(12, current.width * scale);
        const height = Math.max(12, current.height * scale);
        const x = Math.min(
            Math.max(current.x + focus.x * (current.width - width), full.x),
            full.x + full.width - width,
        );
        const y = Math.min(
            Math.max(current.y + focus.y * (current.height - height), full.y),
            full.y + full.height - height,
        );
        setViewBox([x, y, width, height].join(' '));
    }
    function startDrag(event) {
        if (event.button !== 0) return;
        const bounds = svg.current.getBoundingClientRect();
        didDrag.current = false;
        drag.current = {
            clientX: event.clientX,
            clientY: event.clientY,
            viewBox: parseViewBox(viewBox),
            bounds,
        };
    }
    function moveDrag(event) {
        // Convert pointer movement in pixels into a bounded SVG viewBox translation.
        const gesture = drag.current;
        if (!gesture) return;
        const dx = event.clientX - gesture.clientX;
        const dy = event.clientY - gesture.clientY;
        if (Math.abs(dx) <= 4 && Math.abs(dy) <= 4) return;
        event.preventDefault();
        if (!didDrag.current) {
            event.currentTarget.setPointerCapture(event.pointerId);
            didDrag.current = true;
            setDragging(true);
        }
        const full = parseViewBox(brazil.viewBox);
        const x = Math.min(
            Math.max(
                gesture.viewBox.x -
                    (dx / gesture.bounds.width) * gesture.viewBox.width,
                full.x,
            ),
            full.x + full.width - gesture.viewBox.width,
        );
        const y = Math.min(
            Math.max(
                gesture.viewBox.y -
                    (dy / gesture.bounds.height) * gesture.viewBox.height,
                full.y,
            ),
            full.y + full.height - gesture.viewBox.height,
        );
        setViewBox(
            [x, y, gesture.viewBox.width, gesture.viewBox.height].join(' '),
        );
    }
    function endDrag(event) {
        if (!drag.current) return;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        drag.current = null;
        setDragging(false);
    }
    function keySelect(event, state) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(state);
        }
    }
    return (
        <svg
            ref={svg}
            className={dragging ? 'brazil-map is-dragging' : 'brazil-map'}
            viewBox={viewBox}
            role="img"
            onWheel={wheelZoom}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            aria-label={
                selected
                    ? `Mapa do Brasil ampliado no estado ${selected.name}`
                    : 'Mapa do Brasil com os 26 estados e o Distrito Federal'
            }
        >
            <title>Mapa político do Brasil</title>
            <g className="state-shapes">
                {brazil.locations.map((state) => (
                    <path
                        key={state.id}
                        data-state={state.id}
                        d={state.path}
                        className={
                            selected?.id === state.id ? 'is-selected' : ''
                        }
                        role="button"
                        tabIndex={0}
                        aria-label={`${state.name}, ${stateUfs[state.id]}. Ampliar mapa neste estado.`}
                        aria-pressed={selected?.id === state.id}
                        onClick={() => {
                            if (didDrag.current) {
                                didDrag.current = false;
                                return;
                            }
                            onSelect(state);
                        }}
                        onKeyDown={(event) => keySelect(event, state)}
                    >
                        <title>{state.name}</title>
                    </path>
                ))}
            </g>
            <CityReferenceMarker city={selectedCity} scale={markerScale} />
            <MapAlertLayer
                alerts={alerts}
                selected={selectedAlert}
                onSelect={onAlertSelect}
                scale={markerScale}
                shouldIgnoreClick={() => didDrag.current}
            />
        </svg>
    );
}
export default function Map({ token }) {
    const [selected, setSelected] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [enabledSeverities, setEnabledSeverities] = useState(
        () => new Set(severityFilters.map(({ value }) => value)),
    );
    const [alertsState, setAlertsState] = useState('loading');
    const [status, setStatus] = useState(
        'Clique em um estado para ampliar o mapa.',
    );
    const [error, setError] = useState('');
    async function loadAlerts(signal) {
        // Reflect each request outcome so the map remains usable when alert data fails.
        setAlertsState('loading');
        try {
            const response = await getJson('/mapa/alertas', { signal, token });
            setAlerts(response.alertas);
            setAlertsState('ready');
        } catch (err) {
            if (err.name === 'AbortError') return;
            setAlerts([]);
            setAlertsState('error');
        }
    }
    useEffect(() => {
        const controller = new AbortController();
        loadAlerts(controller.signal);
        return () => controller.abort();
    }, [token]);
    useEffect(() => {
        if (!navigator.geolocation) return undefined;
        const controller = new AbortController();
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const query = new URLSearchParams({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    });
                    const response = await getJson('/localizacoes?' + query, {
                        signal: controller.signal,
                        token,
                    });
                    const state = stateByUf(response.cidade.uf);
                    if (!state)
                        throw new Error('Estado brasileiro não identificado.');
                    setSelected(state);
                    setStatus(
                        `${response.cidade.nome}, ${response.cidade.uf}: mapa ampliado em ${state.name}.`,
                    );
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        setError(
                            'Não foi possível identificar seu estado. Clique no mapa para escolher.',
                        );
                    }
                }
            },
            () =>
                setError(
                    'Localização não disponível. Clique no mapa para escolher um estado.',
                ),
            { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false },
        );
        return () => controller.abort();
    }, [token]);
    function select(state) {
        setSelected(state);
        setSelectedCity(null);
        setSelectedAlert(null);
        setError('');
        setStatus(`Mapa ampliado em ${state.name}, ${stateUfs[state.id]}.`);
    }
    function selectAlert(alert) {
        setSelectedAlert(alert);
        setStatus(alert.titulo + ': ' + alert.cidade + ', ' + alert.uf + '.');
    }
    function selectCity(city) {
        const state = stateByUf(city.uf);
        if (!state) return;
        setSelected(state);
        setSelectedCity(city);
        setSelectedAlert(null);
        setError('');
        setStatus(`${city.nome}, ${city.uf}: cidade selecionada no mapa.`);
    }
    const areaAlerts = selected
        ? alerts.filter((alert) => alert.uf === stateUfs[selected.id])
        : alerts;
    const visibleAlerts = areaAlerts.filter((alert) =>
        enabledSeverities.has(alert.nivel),
    );
    const hasActiveFilters = enabledSeverities.size > 0;
    const emptyMessage = selected
        ? `Não há alertas para ${selected.name} com os filtros atuais.`
        : 'Não há alertas para a área consultada com os filtros atuais.';
    function toggleSeverity(level) {
        setSelectedAlert(null);
        setEnabledSeverities((current) => {
            const next = new Set(current);
            if (next.has(level)) next.delete(level);
            else next.add(level);
            return next;
        });
    }
    function retryAlerts() {
        loadAlerts();
    }
    return (
        <div className="app-shell map-page">
            <header className="site-header">
                <a
                    className="wordmark"
                    href="#/"
                    aria-label="WeatherReport, início"
                >
                    <svg viewBox="0 0 40 32" aria-hidden="true">
                        <path
                            d="M11 26h19a8 8 0 0 0 0-16 11 11 0 0 0-21-1 9 9 0 0 0 2 17Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        />
                    </svg>
                    WeatherReport<span className="wordmark-dot">.</span>
                </a>
                <SiteNavigation active="mapa" />
            </header>
            <main>
                <div className="intro map-intro">
                    <p className="eyebrow">MAPA CLIMÁTICO / BRASIL</p>
                    <h1>O Brasil como referência.</h1>
                    <p>
                        Clique em qualquer estado para aproximar a visualização.
                        Use a roda do mouse ou o trackpad sobre o mapa para
                        controlar o zoom com mais precisão.
                    </p>
                </div>
                <section className="map-panel" aria-labelledby="map-title">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">02 / ALERTAS CLIMÁTICOS</p>
                            <h2 id="map-title">
                                Alertas no território brasileiro
                            </h2>
                        </div>
                        {selected && (
                            <span className="badge">
                                {stateUfs[selected.id]}
                            </span>
                        )}
                    </div>
                    <p className="muted">
                        Cada ponto indica um município coberto por um aviso
                        INMET ativo. Clique, use Enter ou Espaço sobre um
                        estado; role sobre o mapa para aproximar ou afastar.
                    </p>
                    <LocationSearch
                        token={token}
                        autoLocate={false}
                        onSelect={selectCity}
                        eyebrow="03 / BUSCA DE CIDADE"
                        title="Encontre uma cidade no mapa"
                        description="Busque qualquer município brasileiro para ampliar o mapa no estado correspondente e consultar seus alertas ativos."
                    />
                    <AlertLegend />
                    <fieldset
                        className="map-alert-filters"
                        aria-describedby="filter-help"
                    >
                        <legend>Filtrar por severidade</legend>
                        <p id="filter-help" className="muted">
                            Os alertas exibidos no mapa respeitam o estado
                            selecionado e os níveis marcados.
                        </p>
                        <div>
                            {severityFilters.map(({ value, label }) => (
                                <label key={value}>
                                    <input
                                        type="checkbox"
                                        checked={enabledSeverities.has(value)}
                                        onChange={() => toggleSeverity(value)}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <div
                        className="map-canvas"
                        aria-busy={alertsState === 'loading'}
                    >
                        <BrazilMap
                            selected={selected}
                            onSelect={select}
                            alerts={visibleAlerts}
                            selectedAlert={selectedAlert}
                            onAlertSelect={selectAlert}
                            selectedCity={selectedCity}
                        />
                    </div>
                    {alertsState === 'loading' && (
                        <p className="map-data-state" role="status">
                            Carregando alertas climáticos…
                        </p>
                    )}
                    {alertsState === 'error' && (
                        <div
                            className="message error map-data-state"
                            role="alert"
                        >
                            <p>
                                Não foi possível carregar os alertas climáticos.
                                Tente novamente em instantes.
                            </p>
                            <button
                                className="secondary"
                                type="button"
                                onClick={retryAlerts}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}
                    {alertsState === 'ready' && visibleAlerts.length === 0 && (
                        <p className="message map-data-state" role="status">
                            {hasActiveFilters
                                ? emptyMessage
                                : 'Selecione ao menos uma severidade para exibir alertas no mapa.'}
                        </p>
                    )}
                    {selectedAlert && (
                        <article
                            className={
                                'map-alert-details ' + selectedAlert.nivel
                            }
                            aria-labelledby="alert-title"
                        >
                            <div className="section-heading">
                                <div>
                                    <p className="eyebrow">
                                        {selectedAlert.nivel}
                                    </p>
                                    <h3 id="alert-title">
                                        {selectedAlert.titulo}
                                    </h3>
                                </div>
                                <button
                                    className="secondary"
                                    type="button"
                                    onClick={() => setSelectedAlert(null)}
                                >
                                    Fechar detalhes
                                </button>
                            </div>
                            <p>
                                <strong>
                                    {selectedAlert.cidade}, {selectedAlert.uf}
                                </strong>
                            </p>
                            <p>
                                {selectedAlert.descricao ||
                                    'Sem descrição adicional para este aviso.'}
                            </p>
                            <p className="muted">
                                Válido de{' '}
                                {new Intl.DateTimeFormat('pt-BR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                }).format(new Date(selectedAlert.inicio))}{' '}
                                até{' '}
                                {new Intl.DateTimeFormat('pt-BR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                }).format(new Date(selectedAlert.fim))}
                                .
                            </p>
                            {selectedAlert.instrucoes.length > 0 && (
                                <ul>
                                    {selectedAlert.instrucoes.map(
                                        (instruction) => (
                                            <li key={instruction}>
                                                {instruction}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
                        </article>
                    )}
                    <p className="map-status" role="status" aria-live="polite">
                        {status}
                    </p>
                    {error && (
                        <p className="message error" role="alert">
                            {error}
                        </p>
                    )}
                    {selected && (
                        <button
                            className="secondary map-reset"
                            type="button"
                            onClick={() => {
                                setSelected(null);
                                setSelectedCity(null);
                                setStatus(
                                    'Exibindo todo o território brasileiro. Clique em um estado para ampliar.',
                                );
                            }}
                        >
                            Ver Brasil inteiro
                        </button>
                    )}
                    <p className="map-attribution">
                        Fronteiras estaduais:{' '}
                        <a
                            href="https://mapsvg.com/maps/brazil"
                            target="_blank"
                            rel="noreferrer"
                        >
                            MapSVG
                        </a>
                        , via svg-country-maps, CC BY 4.0.
                    </p>
                </section>
            </main>
            <footer>
                <span>WeatherReport · Projeto acadêmico</span>
                <span>Mapa de referência geográfica do Brasil</span>
            </footer>
        </div>
    );
}
