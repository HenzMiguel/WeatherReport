import { setTimeout as sleep } from 'node:timers/promises';
import { unavailable } from './errors.js';

// Every attempt, including body parsing, is bounded by its own AbortController.
export function createHttpClient({
  fetchImpl = fetch,
  timeoutMs = 8000,
  attempts = 3,
  backoffMs = 500,
  wait = sleep,
  logger = console,
} = {}) {
  return async function requestJson(
    url,
    { correlationId, beforeAttempt } = {},
  ) {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (beforeAttempt) await beforeAttempt();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let retryable = true;
      try {
        const response = await fetchImpl(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'WeatherReport/1.0 (https://github.com/HenzMiguel/WeatherReport)',
            ...(correlationId ? { 'X-Correlation-Id': correlationId } : {}),
          },
        });
        if (!response.ok) {
          retryable = response.status >= 500 || response.status === 429;
          await response.body?.cancel();
          throw new Error('HTTP ' + response.status);
        }
        // Malformed JSON is not a transient transport failure.
        retryable = false;
        return await response.json();
      } catch (error) {
        if (controller.signal.aborted || error instanceof TypeError)
          retryable = true;
        logger.warn(
          JSON.stringify({
            event: 'provider_failure',
            correlationId,
            host: new URL(url).hostname,
            attempt: attempt + 1,
            reason: controller.signal.aborted ? 'timeout' : error.name,
          }),
        );
        if (!retryable || attempt === attempts - 1) throw unavailable();
      } finally {
        clearTimeout(timer);
      }
      await wait(backoffMs * 2 ** attempt);
    }
  };
}

export function createRateGate(intervalMs = 1100) {
  let queue = Promise.resolve();
  let last = 0;
  return () => {
    const next = queue.then(async () => {
      await sleep(Math.max(0, intervalMs - (Date.now() - last)));
      last = Date.now();
    });
    queue = next.catch(() => {});
    return next;
  };
}
