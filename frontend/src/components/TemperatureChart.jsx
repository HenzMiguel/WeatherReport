import React, { useId } from 'react';
export const number = (value) =>
  value === null || value === undefined
    ? 'Indisponível'
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(
        value,
      );
export default function TemperatureChart({ title, points, rolling = false }) {
  const id = useId();
  const values = points
    .flatMap((p) => [p.value, ...(rolling ? [p.average] : [])])
    .filter(Number.isFinite);
  if (!values.length)
    return (
      <p className="message">
        Não há temperaturas disponíveis para este período.
      </p>
    );
  const low = Math.floor(Math.min(...values) - 2),
    high = Math.ceil(Math.max(...values) + 2);
  const width = 680,
    height = 230,
    left = 44,
    right = 20,
    top = 18,
    bottom = 38;
  const x = (i) =>
    left + (i * (width - left - right)) / Math.max(1, points.length - 1);
  const y = (v) => top + ((high - v) * (height - top - bottom)) / (high - low);
  function path(key) {
    let d = '',
      connected = false;
    points.forEach((p, i) => {
      if (!Number.isFinite(p[key])) {
        connected = false;
        return;
      }
      d += (connected ? 'L' : 'M') + x(i) + ',' + y(p[key]) + ' ';
      connected = true;
    });
    return d;
  }
  const ticks = Array.from(
    { length: 4 },
    (_, i) => low + ((high - low) * i) / 3,
  );
  const labelIndices = new Set(
    [0, 1, 2, 3, 4].map((step) => Math.round((step * (points.length - 1)) / 4)),
  );
  return (
    <div className="chart-wrap">
      <svg
        viewBox={'0 0 ' + width + ' ' + height}
        role="img"
        aria-labelledby={id}
      >
        <title id={id}>{title}. Valores exatos na tabela abaixo.</title>
        {ticks.map((v, i) => (
          <g key={i}>
            <line
              x1={left}
              x2={width - right}
              y1={y(v)}
              y2={y(v)}
              stroke="#deded9"
            />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="axis">
              {Math.round(v)}°
            </text>
          </g>
        ))}
        {rolling && (
          <path
            d={path('average')}
            fill="none"
            stroke="#888"
            strokeWidth="2"
            strokeDasharray="6 5"
          />
        )}
        <path
          d={path('value')}
          fill="none"
          stroke="#20201f"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <g key={p.label + i}>
            {Number.isFinite(p.value) && (
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r={p.anomaly ? 5 : 3}
                fill={p.anomaly ? 'white' : '#20201f'}
                stroke="#20201f"
                strokeWidth="2"
              >
                <title>
                  {p.label +
                    ': ' +
                    number(p.value) +
                    ' °C' +
                    (p.anomaly ? ' — anomalia' : '')}
                </title>
              </circle>
            )}
            {labelIndices.has(i) && (
              <text
                x={x(i)}
                y={height - 10}
                textAnchor={
                  i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'
                }
                className="axis"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      {rolling && (
        <p className="chart-legend">
          <span>━ Temperatura</span>
          <span>┄ Média móvel de 3h</span>
          <span>○ Anomalia</span>
        </p>
      )}
    </div>
  );
}
