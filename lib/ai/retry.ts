const RETRYABLE_STATUS = [429, 500, 503];

function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return RETRYABLE_STATUS.some((code) => message.includes(String(code))) || /UNAVAILABLE|high demand/i.test(message);
}

/** Retries a Gemini API call up to `attempts` times with short exponential
 * backoff, only for errors that look transient (503 overload, 429 rate
 * limit) — anything else (bad request, auth failure) fails immediately. */
export async function withGeminiRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || i === attempts - 1) throw error;
      const delayMs = 500 * 2 ** i; // 500ms, 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
