import { logger, retry, throttle } from "../index.js";

/**
 * Centralized executor for outbound calls
 */
async function executeWithRetryAndThrottle(
  fn,
  {
    retries = 3,
    delay = 500,
    factor = 2,
    retryOnStatuses = [408, 429, 500, 502, 503, 504],
    context = {},
  } = {}
) {
  let attempt = 0;

  return retry(
    async () => {
      attempt++;

      // 👇 throttle ONLY on retries
      if (attempt > 1) {
        await throttle();
      }

      try {
        logger.debug("Executing outbound operation", {
          ...context,
          attempt,
        });
        return await fn();
      } catch (error) {
        const status = error.response?.status;
        const code = error.code;

        logger.warn("Outbound operation failed", {
          ...context,
          attempt,
          status,
          code,
          message: error.message,
        });

        const retryable =
          retryOnStatuses.includes(status) ||
          ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"].includes(code);

        if (!retryable) {
          logger.error("Non-retryable error", {
            ...context,
            status,
            code,
          });
          throw error;
        }

        throw error; // retry
      }
    },
    { retries, delay, factor }
  );
}

export { executeWithRetryAndThrottle };
