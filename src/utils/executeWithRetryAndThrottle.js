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
  try {
    await throttle();

    return await retry(
      async () => {
        try {
          logger.debug("Executing outbound operation", context);
          return await fn();
        } catch (error) {
          const status = error.response?.status;

          logger.warn("Outbound operation failed", {
            ...context,
            status,
            message: error.message,
          });

          // Decide if retryable
          if (status && !retryOnStatuses.includes(status)) {
            logger.error("Non-retryable error encountered", {
              ...context,
              status,
            });
            throw error; // breaks retry loop
          }

          throw error; // retryable
        }
      },
      { retries, delay, factor }
    );
  } catch (error) {
    logger.error("Operation failed after retries", {
      ...context,
      message: error.message,
    });
    throw error;
  }
}

export { executeWithRetryAndThrottle };
