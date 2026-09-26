import React, { useEffect, useRef, useState } from 'react';
import { getJson } from '../services/api';
const UFS =
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(
    ' ',
  );
export default function LocationSearch({ onSelect, token }) {
  const [name, setName] = useState('');
  const [uf, setUf] = useState('');
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const request = useRef(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      request.current?.abort();
    },
    [],
  );
  async function search(page = 1, existing) {
    const params = existing || { nome: name.trim(), uf };
    if (!params.nome && !params.uf) {
      setError('Informe uma cidade ou selecione um estado.');
      return;
    }
    generation.current++;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setMessage('');
    setResults(null);
    try {
      const qs = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(params).filter(([, value]) => value),
        ),
        page,
        limit: 6,
      });
      const data = await getJson('/cidades?' + qs, {
        signal: controller.signal,
        token,
      });
      setResults(data);
      setQuery(params);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setError('Seu navegador não oferece localização. Use a busca manual.');
      return;
    }
    const current = ++generation.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setMessage('Aguardando sua permissão e localização…');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (generation.current !== current) return;
        setMessage('Identificando seu município…');
        try {
          const qs = new URLSearchParams({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          const data = await getJson('/localizacoes?' + qs, {
            signal: controller.signal,
            token,
          });
          setResults({
            dados: [data.cidade],
            paginacao: { pagina_atual: 1, total_paginas: 1, total_itens: 1 },
          });
          setMessage(data.mensagem);
        } catch (err) {
          if (err.name !== 'AbortError') {
            setError(err.message);
            setMessage('');
          }
        } finally {
          if (!controller.signal.aborted) setBusy(false);
        }
      },
      (err) => {
        if (generation.current !== current) return;
        setBusy(false);
        setMessage('');
        setError(
          err.code === 1
            ? 'Permissão de localização negada. Você pode buscar sua cidade abaixo.'
            : 'Não foi possível obter sua localização. Use a busca manual.',
        );
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false },
    );
  }
  return (
    <section className="location-panel" aria-labelledby="location-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 / LOCALIZAÇÃO</p>
          <h2 id="location-title">Qual é a sua cidade?</h2>
        </div>
        <button className="secondary" onClick={locate} disabled={busy}>
          ◎ Usar minha localização
        </button>
      </div>
      <p className="muted">
        Busque qualquer município brasileiro. Ao usar a localização, suas
        coordenadas serão enviadas ao serviço de identificação da cidade.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
        className="search-form"
      >
        <label htmlFor="city-name">Cidade</label>
        <input
          id="city-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Chapecó"
          minLength={2}
          maxLength={100}
        />
        <label htmlFor="city-state">Estado</label>
        <select
          id="city-state"
          value={uf}
          onChange={(event) => setUf(event.target.value)}
        >
          <option value="">Todas as UFs</option>
          {UFS.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <button type="submit" disabled={busy}>
          {busy ? 'Consultando…' : 'Buscar cidade →'}
        </button>
      </form>
      {error && (
        <p role="alert" className="message error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="message">
          {message}
        </p>
      )}
      {results && (
        <div aria-live="polite">
          <p className="result-count">
            {results.paginacao.total_itens
              ? results.paginacao.total_itens +
                ' município(s) encontrado(s). Selecione para consultar.'
              : 'Nenhuma cidade encontrada. Confira o nome e o estado.'}
          </p>
          <div className="city-results">
            {results.dados.map((city) => (
              <button
                className="city-option"
                key={city.id}
                onClick={() => onSelect(city)}
              >
                <span>
                  {city.nome} <small>{city.uf}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          {results.paginacao.total_paginas > 1 && (
            <div className="pagination">
              <button
                className="secondary"
                disabled={busy || results.paginacao.pagina_atual === 1}
                onClick={() =>
                  search(results.paginacao.pagina_atual - 1, query)
                }
              >
                Anterior
              </button>
              <span>
                Página {results.paginacao.pagina_atual} de{' '}
                {results.paginacao.total_paginas}
              </span>
              <button
                className="secondary"
                disabled={
                  busy ||
                  results.paginacao.pagina_atual >=
                    results.paginacao.total_paginas
                }
                onClick={() =>
                  search(results.paginacao.pagina_atual + 1, query)
                }
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
