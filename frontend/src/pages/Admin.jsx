import React, { useEffect, useState } from 'react';
import { getJson, postJson } from '../services/api';
const tokenKey = 'weatherreport.admin-token';
function Header() {
  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="WeatherReport, início">
        WeatherReport<span className="wordmark-dot">.</span>
      </a>
      <a className="header-link" href="/">
        Ver dashboard
      </a>
    </header>
  );
}
function formatPeriod(period) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(period));
}
function MetricsChart({
  id,
  title,
  eyebrow,
  data,
  valueKey,
  unit = '',
  tone = '',
}) {
  const values = data.map((bucket) => bucket[valueKey] ?? 0);
  const max = Math.max(1, ...values);
  return (
    <section className="admin-chart" aria-labelledby={`${id}-title`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <span className="muted">Últimos 60 minutos</span>
      </div>
      <div
        className={`request-bars ${tone}`}
        role="img"
        aria-label={`${title} nos últimos 60 minutos`}
      >
        {data.map((bucket) => {
          const value = bucket[valueKey] ?? 0;
          return (
            <span
              key={bucket.inicio}
              title={`${new Date(bucket.inicio).toLocaleTimeString('pt-BR')}: ${value}${unit}`}
              style={{ height: Math.max(3, (value / max) * 100) + '%' }}
            />
          );
        })}
      </div>
    </section>
  );
}
function Metrics({ metrics, onRefresh, busy, error }) {
  return (
    <section className="admin-metrics" aria-labelledby="admin-title">
      <div className="admin-title-row">
        <div>
          <p className="eyebrow">ÁREA RESTRITA</p>
          <h1 id="admin-title">Painel administrativo</h1>
        </div>
        <button className="secondary" onClick={onRefresh} disabled={busy}>
          {busy ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
      {!metrics && !error && (
        <div className="loading-state" role="status">
          Carregando métricas do sistema…
        </div>
      )}
      {metrics && (
        <>
          <p className="metric-period">
            Período de referência: {formatPeriod(metrics.periodo.inicio)} —{' '}
            {formatPeriod(metrics.periodo.fim)} (janela móvel de 1 hora).
          </p>
          <div className="admin-stat-grid">
            <article>
              <span>Requisições</span>
              <strong>{metrics.total_requisicoes}</strong>
              <small>no período</small>
            </article>
            <article>
              <span>Erros</span>
              <strong>{metrics.total_erros}</strong>
              <small>respostas 4xx e 5xx</small>
            </article>
            <article>
              <span>CPU</span>
              <strong>{metrics.uso_cpu_porcentagem}%</strong>
              <small>uso do processo</small>
            </article>
            <article>
              <span>Memória</span>
              <strong>
                {metrics.consumo_memoria_mb} <small>MB</small>
              </strong>
              <small>memória residente</small>
            </article>
          </div>
          <div className="admin-charts">
            <MetricsChart
              id="requests"
              title="Volume por minuto"
              eyebrow="REQUISIÇÕES"
              data={metrics.requisicoes_por_intervalo}
              valueKey="quantidade"
              unit=" requisições"
            />
            <MetricsChart
              id="errors"
              title="Erros por minuto"
              eyebrow="ERROS"
              data={metrics.erros_por_intervalo}
              valueKey="quantidade"
              unit=" erros"
              tone="error-bars"
            />
            <MetricsChart
              id="cpu"
              title="Uso por minuto"
              eyebrow="CPU"
              data={metrics.uso_cpu_por_intervalo}
              valueKey="porcentagem"
              unit="%"
              tone="cpu-bars"
            />
            <MetricsChart
              id="memory"
              title="Consumo por minuto"
              eyebrow="MEMÓRIA"
              data={metrics.consumo_memoria_por_intervalo}
              valueKey="megabytes"
              unit=" MB"
              tone="memory-bars"
            />
          </div>
          <section
            className="admin-errors"
            aria-labelledby="generated-errors-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">ERROS GERADOS</p>
                <h2 id="generated-errors-title">Ocorrências no período</h2>
              </div>
            </div>
            {metrics.erros.length ? (
              <ul>
                {metrics.erros.map((item) => (
                  <li key={`${item.timestamp}-${item.correlation_id}`}>
                    <time dateTime={item.timestamp}>
                      {formatPeriod(item.timestamp)}
                    </time>
                    <code>
                      {item.metodo} {item.rota}
                    </code>
                    <strong>{item.status}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Nenhum erro foi gerado neste período.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenKey));
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  useEffect(() => {
    if (!token) return;
    getJson('/admin/sessao', { token })
      .then(setSession)
      .catch((reason) => {
        sessionStorage.removeItem(tokenKey);
        setToken(null);
        setError(reason.message);
      });
  }, [token]);
  async function loadMetrics() {
    setBusy(true);
    setError('');
    try {
      setMetrics(await getJson('/admin/metricas', { token }));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (session) loadMetrics();
  }, [session]);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await postJson('/auth/login', { email, senha: password });
      if (result.papel !== 'ADMIN')
        throw new Error('Esta conta não possui acesso administrativo.');
      sessionStorage.setItem(tokenKey, result.token_acesso);
      setToken(result.token_acesso);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }
  function signOut() {
    sessionStorage.removeItem(tokenKey);
    setSession(null);
    setMetrics(null);
    setToken(null);
  }
  return (
    <div className="app-shell">
      <Header />
      <main className="admin-page">
        {!token && (
          <section className="admin-card" aria-labelledby="admin-login-title">
            <p className="eyebrow">ÁREA RESTRITA</p>
            <h1 id="admin-login-title">Acesso administrativo</h1>
            <p>Entre com uma conta de administrador para continuar.</p>
            <form className="admin-form" onSubmit={submit}>
              <label htmlFor="admin-email">E-mail</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <label htmlFor="admin-password">Senha</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {error && (
                <p className="message error" role="alert">
                  {error}
                </p>
              )}
              <button disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
            </form>
          </section>
        )}
        {token && !session && (
          <div className="loading-state" role="status">
            Validando sessão administrativa…
          </div>
        )}
        {session && (
          <>
            <Metrics
              metrics={metrics}
              onRefresh={loadMetrics}
              busy={busy}
              error={error}
            />
            <button className="secondary admin-signout" onClick={signOut}>
              Sair
            </button>
          </>
        )}
      </main>
    </div>
  );
}
