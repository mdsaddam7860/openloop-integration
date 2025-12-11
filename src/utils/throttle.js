let lastCallTime = 0;
const MIN_INTERVAL = 300; // 300ms between calls

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL - (now - lastCallTime));

  if (wait > 0) {
    await new Promise((res) => setTimeout(res, wait));
  }

  lastCallTime = Date.now();
}

export { throttle };
