async function retry(fn, { retries = 3, delay = 500, factor = 2 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === retries) break;

      // Exponential backoff
      const baseDelay = delay * Math.pow(factor, attempt - 1);

      // ✅ Full jitter: random delay between 0 and baseDelay
      const jitteredDelay = Math.random() * baseDelay;

      await new Promise((res) => setTimeout(res, jitteredDelay));
    }
  }

  throw lastError;
}

export { retry };
