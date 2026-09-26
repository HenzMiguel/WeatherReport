export async function getJson(path, { signal, token } = {}) {
  let response;
  try {
    response = await fetch('/api/v1' + path, {
      signal,
      headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(
      'Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.',
    );
  }
  let body;
  try {
    body = await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(
      'O servidor não retornou os dados esperados. Tente novamente em instantes.',
    );
  }
  if (!response.ok)
    throw new Error(
      body.mensagem_erro || 'Não foi possível consultar os dados.',
    );
  return body;
}
