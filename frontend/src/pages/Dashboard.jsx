import React, { useEffect, useRef, useState } from 'react';
import LocationSearch from '../components/LocationSearch';
import TemperatureChart, { number } from '../components/TemperatureChart';
import { getJson } from '../services/api';
const riskNames = {
  NORMAL: 'Sem avisos publicados',
  ATENCAO: 'Atenção',
  ALERTA: 'Alerta',
  EMERGENCIA: 'Grande perigo',
};
const signed = (value) =>
  value === null
    ? 'Indisponível'
    : (value > 0 ? '+' : '') + number(value) + ' °C';
function dateTime(value, timezone) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
function hour(value, timezone) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
function Summary({ data }) {
  const anomalyCount = data.historico_24h.filter(
    (p) => p.anomalia === true,
  ).length;
  return (
    <>
      <div className="metrics">
        <article className="metric primary">
          <p className="eyebrow">TEMPERATURA AGORA</p>
          <p className="temperature">
            {data.temperatura_hoje === null
              ? '—'
              : number(data.temperatura_hoje)}
            <span>°C</span>
          </p>
          <p className="muted">
            {data.temperatura_hoje === null
              ? 'Temperatura indisponível'
              : 'Condição mais recente do modelo'}
          </p>
        </article>
        <article className="metric">
          <p className="eyebrow">EM RELAÇÃO A ONTEM</p>
          <p className="metric-value">
            {signed(data.diferenca_temperatura_ontem)}
          </p>
          <p className="muted">Comparação com a mesma hora local.</p>
        </article>
        <article className="metric">
          <p className="eyebrow">ANOMALIAS / ÚLTIMAS 24H</p>
          <p className="metric-value">
            {data.historico_24h.some((p) => p.anomalia !== null)
              ? anomalyCount
              : '—'}{' '}
            <span className="small-unit">
              {anomalyCount === 1 ? 'registro' : 'registros'}
            </span>
          </p>
          <p className="muted">
            Desvios estatísticos em relação aos sete dias anteriores.
          </p>
        </article>
      </div>
    </>
  );
}
function Risk({ data }) {
  const risk = data.nivel_risco_semana;
  return (
    <section
      className={'risk-panel ' + (risk && risk !== 'NORMAL' ? 'has-alert' : '')}
      aria-labelledby="risk-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">AVISOS PARA A SEMANA</p>
          <h2 id="risk-title">
            {risk === null ? 'Risco indisponível' : riskNames[risk]}
          </h2>
        </div>
        <span className="badge">INMET</span>
      </div>
      <p>
        {risk === null
          ? 'Não foi possível consultar a fonte de alertas. Tente atualizar em alguns instantes.'
          : data.risco_semana.cobertura}
      </p>
      <p className="muted">
        Consulta de {dateTime(data.risco_semana.inicio, data.fuso_horario)} até{' '}
        {dateTime(data.risco_semana.fim, data.fuso_horario)}.
      </p>
      {data.risco_semana.alertas.map((alert) => (
        <details key={alert.id} className="alert-item">
          <summary>
            <strong>{alert.titulo}</strong>
            <span>{riskNames[alert.nivel]}</span>
          </summary>
          <p>{alert.descricao}</p>
          <p className="muted">
            {dateTime(alert.inicio, data.fuso_horario)} até{' '}
            {dateTime(alert.fim, data.fuso_horario)}
          </p>
          {alert.instrucoes.length > 0 && (
            <ul>
              {alert.instrucoes.map((instruction, i) => (
                <li key={i}>{instruction}</li>
              ))}
            </ul>
          )}
        </details>
      ))}
    </section>
  );
}
function History({ data }) {
  const daily = data.grafico_semanal.map((p) => ({
    label: p.data.slice(8, 10) + '/' + p.data.slice(5, 7),
    value: p.temperatura,
  }));
  const hourly = data.historico_24h.map((p) => ({
    label: hour(p.horario, data.fuso_horario),
    value: p.temperatura,
    average: p.media_movel,
    anomaly: p.anomalia,
  }));
  const anomalies = data.historico_24h.filter((p) => p.anomalia);
  const incomplete = data.historico_24h.filter(
    (p) => p.anomalia === null,
  ).length;
  return (
    <>
      <section className="chart-panel" aria-labelledby="weekly-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / HISTÓRICO SEMANAL</p>
            <h2 id="weekly-title">Uma semana de temperaturas</h2>
          </div>
          <span className="badge">MÉDIAS DIÁRIAS · °C</span>
        </div>
        <p className="muted">
          De hoje até sete dias atrás. A média de hoje considera apenas as horas
          já disponíveis.
        </p>
        <TemperatureChart
          title="Médias diárias da temperatura"
          points={daily}
        />
        <details className="data-details">
          <summary>Ver valores do gráfico semanal</summary>
          <div className="table-scroll">
            <table>
              <caption>Médias diárias em graus Celsius</caption>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Temperatura</th>
                  <th>Amostras</th>
                  <th>Período</th>
                </tr>
              </thead>
              <tbody>
                {data.grafico_semanal.map((p) => (
                  <tr key={p.data}>
                    <td>{p.data.split('-').reverse().join('/')}</td>
                    <td>{number(p.temperatura)}</td>
                    <td>{p.amostras}</td>
                    <td>{p.parcial ? 'Parcial' : 'Completo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <section className="chart-panel" aria-labelledby="hourly-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">03 / HISTÓRICO HORÁRIO</p>
            <h2 id="hourly-title">As últimas 24 horas</h2>
          </div>
          <span className="badge">HORÁRIO DA CIDADE</span>
        </div>
        <p className="muted">
          A linha tracejada mostra a média móvel. Círculos vazados identificam
          anomalias.
        </p>
        <TemperatureChart
          title="Temperatura horária e média móvel"
          points={hourly}
          rolling
        />
        <details className="data-details">
          <summary>Ver valores das últimas 24 horas</summary>
          <div className="table-scroll">
            <table>
              <caption>Histórico horário em graus Celsius</caption>
              <thead>
                <tr>
                  <th>Data e hora</th>
                  <th>Temperatura</th>
                  <th>Média móvel</th>
                  <th>Referência</th>
                  <th>Desvio</th>
                  <th>Anomalia</th>
                </tr>
              </thead>
              <tbody>
                {data.historico_24h.map((p) => (
                  <tr key={p.horario}>
                    <td>{dateTime(p.horario, data.fuso_horario)}</td>
                    <td>{number(p.temperatura)}</td>
                    <td>{number(p.media_movel)}</td>
                    <td>{number(p.media_referencia)}</td>
                    <td>{number(p.desvio)}</td>
                    <td>
                      {p.anomalia === null
                        ? 'Sem referência'
                        : p.anomalia
                          ? 'Sim'
                          : 'Não'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <section className="anomaly-panel" aria-labelledby="anomaly-title">
        <p className="eyebrow">04 / LEITURA DOS DADOS</p>
        <h2 id="anomaly-title">Anomalias de temperatura</h2>
        <p>{data.metodologia.anomalias}</p>
        {anomalies.length ? (
          <ul className="anomaly-list">
            {anomalies.map((p) => (
              <li key={p.horario}>
                <strong>{dateTime(p.horario, data.fuso_horario)}</strong>
                <span>
                  {number(p.temperatura)} °C · referência{' '}
                  {number(p.media_referencia)} °C · desvio {signed(p.desvio)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="message">
            {incomplete === 24
              ? 'Dados insuficientes para identificar anomalias neste período.'
              : 'Nenhuma anomalia identificada nos horários com referência suficiente.'}
          </p>
        )}
        {incomplete > 0 && incomplete < 24 && (
          <p className="muted">
            {incomplete} horário(s) sem dados suficientes para avaliar
            anomalias.
          </p>
        )}
        <details className="data-details">
          <summary>Como os indicadores são calculados</summary>
          <dl>
            <dt>Comparação com ontem</dt>
            <dd>{data.metodologia.comparacao_ontem}</dd>
            <dt>Gráfico semanal</dt>
            <dd>{data.metodologia.grafico_semanal}</dd>
            <dt>Média móvel</dt>
            <dd>{data.metodologia.media_movel}</dd>
          </dl>
        </details>
      </section>
    </>
  );
}
export default function Dashboard({ token }) {
  const [city, setCity] = useState(null),
    [data, setData] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [refresh, setRefresh] = useState(0);
  const resultHeading = useRef(null);
  useEffect(() => {
    if (!city) return;
    const controller = new AbortController();
    setData(null);
    setError('');
    setBusy(true);
    getJson('/cidades/' + city.id + '/previsao', {
      signal: controller.signal,
      token,
    })
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [city, refresh, token]);
  function select(selected) {
    setCity(selected);
    setRefresh((value) => value + 1);
    requestAnimationFrame(() =>
      resultHeading.current?.focus({ preventScroll: true }),
    );
  }
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="WeatherReport, início">
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
        <span className="header-label">OBSERVATÓRIO DO TEMPO / BRASIL</span>
      </header>
      <main>
        <div className="intro">
          <p className="eyebrow">DASHBOARD CLIMÁTICO</p>
          <h1>O tempo, em perspectiva.</h1>
          <p>
            Da temperatura de agora às mudanças da semana.
            <br />
            Escolha sua cidade para acompanhar.
          </p>
        </div>
        <LocationSearch onSelect={select} token={token} />
        {!city && (
          <section className="empty-state">
            <span className="empty-symbol" aria-hidden="true">
              ↗
            </span>
            <div>
              <h2>Seu próximo olhar para o clima começa aqui.</h2>
              <p>
                Selecione uma cidade para ver temperaturas, gráficos e avisos
                meteorológicos.
              </p>
            </div>
          </section>
        )}
        {city && (
          <section className="weather-results" aria-busy={busy}>
            <div className="city-heading">
              <div>
                <p className="eyebrow">PANORAMA LOCAL</p>
                <h2 ref={resultHeading} tabIndex={-1}>
                  {city.nome}
                  <span> / {city.uf}</span>
                </h2>
                {data && (
                  <p className="muted">
                    Dados de {dateTime(data.atualizado_em, data.fuso_horario)} ·{' '}
                    {data.fuso_horario}
                  </p>
                )}
              </div>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => setRefresh((value) => value + 1)}
              >
                ↻ Atualizar
              </button>
            </div>
            {busy && (
              <div className="loading-state" role="status">
                <span className="loading-dot" />
                Consultando temperaturas e avisos de {city.nome}…
              </div>
            )}
            {error && (
              <div className="message error" role="alert">
                <p>{error}</p>
                <button onClick={() => setRefresh((value) => value + 1)}>
                  Tentar novamente
                </button>
              </div>
            )}
            {data && (
              <>
                {data.avisos.length > 0 && (
                  <div className="message" role="status">
                    {data.avisos.map((w) => (
                      <p key={w}>{w}</p>
                    ))}
                  </div>
                )}
                <Summary data={data} />
                <Risk data={data} />
                <History data={data} />
                <p className="source-note">
                  {data.fonte}. Histórico baseado em modelos, não em medições de
                  uma estação local. Consultado em{' '}
                  {dateTime(data.consultado_em, data.fuso_horario)}.
                  Atualizações podem usar cache de até 10 minutos.
                </p>
              </>
            )}
          </section>
        )}
      </main>
      <footer>
        <span>WeatherReport · Projeto acadêmico</span>
        <div>
          Fontes:{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{' '}
          ·{' '}
          <a
            href="https://radarmeteorologico.com.br/"
            target="_blank"
            rel="noreferrer"
          >
            Radar Meteorológico / INMET
          </a>{' '}
          ·{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap
          </a>
        </div>
      </footer>
    </div>
  );
}
