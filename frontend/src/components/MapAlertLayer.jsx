import React, { useLayoutEffect, useState } from 'react';

const severityNames = {
  ALERTA: 'Alerta',
  EMERGENCIA: 'Emergência',
};

function position({ latitude, longitude }) {
  // The MapSVG Brazil asset uses an approximately geographic 613 × 639 viewBox.
  return {
    x: ((longitude + 74) / 40) * 613,
    y: ((5.5 - latitude) / 39.5) * 639,
  };
}

function nearestPointInState(path, candidate) {
  if (path.isPointInFill(new DOMPoint(candidate.x, candidate.y)))
    return candidate;
  for (let radius = 2; radius <= 120; radius += 2) {
    for (let step = 0; step < 48; step++) {
      const angle = (step / 48) * Math.PI * 2;
      const point = {
        x: candidate.x + Math.cos(angle) * radius,
        y: candidate.y + Math.sin(angle) * radius,
      };
      if (path.isPointInFill(new DOMPoint(point.x, point.y))) return point;
    }
  }
  return candidate;
}

export function AlertLegend() {
  return (
    <ul className="map-alert-legend" aria-label="Legenda de severidade">
      {Object.entries(severityNames).map(([level, label]) => (
        <li key={level}>
          <span className={'map-alert-symbol ' + level} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export default function MapAlertLayer({
  alerts,
  selected,
  onSelect,
  scale,
  shouldIgnoreClick,
}) {
  const [anchoredPositions, setAnchoredPositions] = useState({});
  useLayoutEffect(() => {
    const next = {};
    for (const alert of alerts) {
      const path = document.querySelector(
        `[data-state="${alert.uf.toLowerCase()}"]`,
      );
      if (path) next[alert.id] = nearestPointInState(path, position(alert));
    }
    setAnchoredPositions(next);
  }, [alerts]);
  return (
    <g className="map-alert-points">
      {alerts.map((alert) => {
        const point = anchoredPositions[alert.id] || position(alert);
        const active = selected?.id === alert.id;
        const label = `${severityNames[alert.nivel]}: ${alert.titulo}, ${alert.cidade}, ${alert.uf}`;
        return (
          <g
            key={alert.id}
            className={
              'map-alert-point ' + alert.nivel + (active ? ' is-selected' : '')
            }
            transform={`translate(${point.x} ${point.y}) scale(${scale})`}
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={active}
            onClick={() => {
              if (!shouldIgnoreClick()) onSelect(alert);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(alert);
              }
            }}
          >
            <title>{label}</title>
            <circle className="map-alert-ring" r="6" />
            <circle className="map-alert-core" r="3" />
          </g>
        );
      })}
    </g>
  );
}
