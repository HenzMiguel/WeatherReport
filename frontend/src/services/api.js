export async function postJson(path, body, { signal } = {}) {
    return requestJson(path, {
        signal,
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });
}
export async function getJson(path, { signal, token } = {}) {
    return requestJson(path, { signal, token });
}
async function requestJson(
    path,
    { signal, token, method, body, headers } = {},
) {
    let response;
    try {
        response = await fetch('/api/v1' + path, {
            signal,
            method,
            body,
            headers: {
                ...headers,
                ...(token ? { Authorization: 'Bearer ' + token } : {}),
            },
        });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error(
            'Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.',
        );
    }
    let responseBody;
    try {
        responseBody = await response.json();
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error(
            'O servidor não retornou os dados esperados. Tente novamente em instantes.',
        );
    }
    if (!response.ok)
        throw new Error(
            responseBody.mensagem_erro ||
                'Não foi possível consultar os dados.',
        );
    return responseBody;
}
