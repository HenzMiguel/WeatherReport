import React, { useEffect, useRef, useState } from 'react';
import brazil from '@svg-country-maps/brazil';
import { getJson } from '../services/api';
import SiteNavigation from '../components/SiteNavigation';

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
function zoomBox(path) {
  const { x, y, width, height } = path.getBBox();
  const padding = Math.max(width, height) * 0.6 + 8;
  return `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`;
}
function parseViewBox(value) {
  const [x, y, width, height] = value.split(' ').map(Number);
  return { x, y, width, height };
}
function BrazilMap({ selected, onSelect }) {
  const svg = useRef(null);
  const [viewBox, setViewBox] = useState(brazil.viewBox);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const didDrag = useRef(false);
  useEffect(() => {
    if (!selected) {
      setViewBox(brazil.viewBox);
      return;
    }
    const path = svg.current?.querySelector(`[data-state="${selected.id}"]`);
    if (path) setViewBox(zoomBox(path));
  }, [selected]);
  function wheelZoom(event) {
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
        gesture.viewBox.x - (dx / gesture.bounds.width) * gesture.viewBox.width,
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
    setViewBox([x, y, gesture.viewBox.width, gesture.viewBox.height].join(' '));
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
            className={selected?.id === state.id ? 'is-selected' : ''}
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
    </svg>
  );
}
export default function Map({ token }) {
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(
    'Clique em um estado para ampliar o mapa.',
  );
  const [error, setError] = useState('');
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
          if (!state) throw new Error('Estado brasileiro não identificado.');
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
    setError('');
    setStatus(`Mapa ampliado em ${state.name}, ${stateUfs[state.id]}.`);
  }
  return (
    <div className="app-shell map-page">
      <header className="site-header">
        <a className="wordmark" href="#/" aria-label="WeatherReport, início">
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
            Clique em qualquer estado para aproximar a visualização. Use a roda
            do mouse ou o trackpad sobre o mapa para controlar o zoom com mais
            precisão.
          </p>
        </div>
        <section className="map-panel" aria-labelledby="map-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / RECORTE GEOGRÁFICO</p>
              <h2 id="map-title">Território brasileiro</h2>
            </div>
            {selected && <span className="badge">{stateUfs[selected.id]}</span>}
          </div>
          <p className="muted">
            Fronteiras estaduais e Distrito Federal. Clique, use Enter ou Espaço
            sobre um estado; role sobre o mapa para aproximar ou afastar.
          </p>
          <div className="map-canvas">
            <BrazilMap selected={selected} onSelect={select} />
          </div>
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
