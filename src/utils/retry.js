async function retry(fn, { retries = 3, delay = 500, factor = 2 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === retries) break;

      const wait = delay * Math.pow(factor, attempt - 1);
      await new Promise((res) => setTimeout(res, wait));
    }
  }

  throw lastError;
}

export { retry };
