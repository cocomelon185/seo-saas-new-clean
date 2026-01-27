const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchWithTimeoutRetry(url, init = {}, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? 12000);
  const maxAttempts = Number(opts.maxAttempts ?? 3);
  const baseDelayMs = Number(opts.baseDelayMs ?? 350);

  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(new Error("timeout")), timeoutMs);

    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });

      const retryable =
        res.status === 408 ||
        res.status === 429 ||
        (res.status >= 500 && res.status <= 599);

      if (!retryable) return res;

      lastErr = new Error(`retryable_http_${res.status}`);

      if (attempt < maxAttempts) {
        const jitter = Math.floor(Math.random() * 150);
        const backoff = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
        await sleep(backoff);
        continue;
      }

      return res;
    } catch (e) {
      lastErr = e;
      const msg = String(e && e.message ? e.message : e);
      const retryable =
        msg.includes("timeout") ||
        msg.includes("AbortError") ||
        msg.includes("fetch") ||
        msg.includes("network");

      if (attempt < maxAttempts && retryable) {
        const jitter = Math.floor(Math.random() * 150);
        const backoff = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
        await sleep(backoff);
        continue;
      }
      throw e;
    } finally {
      clearTimeout(t);
    }
  }

  throw lastErr || new Error("request_failed");
}
