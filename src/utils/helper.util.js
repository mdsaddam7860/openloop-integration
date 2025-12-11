import crypto from "crypto";
function timingSafeEq(a, b) {
  try {
    const A = Buffer.from(String(a));
    const B = Buffer.from(String(b));
    if (A.length !== B.length) return false;
    return crypto.timingSafeEqual(A, B);
  } catch {
    return false;
  }
}

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
function sha256Base64(buf) {
  return crypto.createHash("sha256").update(buf).digest("base64");
}
function hmacSha256Hex(key, buf) {
  return crypto.createHmac("sha256", key).update(buf).digest("hex");
}
function hmacSha256Base64(key, buf) {
  return crypto.createHmac("sha256", key).update(buf).digest("base64");
}

function parseHeaderRightSide(headerVal) {
  if (!headerVal) return null;
  const idx = headerVal.indexOf("=");
  return idx >= 0 ? headerVal.slice(idx + 1) : headerVal;
}
function isProbableHex(s) {
  return /^[0-9a-fA-F]{64}$/.test(s);
}
function isProbableBase64(s) {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(s);
}

// parse signature-input: returns array of fields in order (e.g. ['@method','@path','@query','content-digest',...])
function parseSigInput(sigInputHeader) {
  if (!sigInputHeader) return null;
  // Example: sig1=("@method" "@path" "@query" "content-digest" "content-type" "content-length");created=...
  const m = sigInputHeader.match(/sig1=\(([^)]+)\)/i);
  if (!m) return null;
  return m[1].split(/\s+/).map((s) => s.replace(/^"|"$/g, ""));
}

// build canonical string according to the signature-input order (one-line-per-component)
function buildCanonicalString(req, fields) {
  // req.rawBody should be Buffer if available
  const lines = [];
  for (const f of fields) {
    if (f === "@method") {
      lines.push(
        `(request-target): ${req.method.toLowerCase()} ${
          req.path || req.originalUrl || req.url || "/"
        }`
      );
    } else if (f === "@path") {
      // If Healthie expects @path separately, include it as path only
      const p = (req.path || req.originalUrl || req.url || "/").split("?")[0];
      lines.push(`@path: ${p}`);
    } else if (f === "@query") {
      const q =
        req.originalUrl && req.originalUrl.includes("?")
          ? req.originalUrl.split("?")[1]
          : "";
      lines.push(`@query: ${q}`);
    } else {
      // header name exactly as in signature-input; signature-input lists lowercase headers
      const hv = req.headers[f] ?? req.headers[f.toLowerCase()] ?? "";
      lines.push(`${f}: ${hv}`);
    }
  }
  return lines.join("\n");
}

// verify content-digest and signature. returns true/false
function verifyRequest(req) {
  // obtain raw bytes
  let rawBuf = null;
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) rawBuf = req.rawBody;
  else if (req.rawBody && typeof req.rawBody === "string")
    rawBuf = Buffer.from(req.rawBody, "utf8");
  else if (req.body && typeof req.body === "object") {
    // fallback: reserialize JSON. This is less-safe — avoid in prod.
    rawBuf = Buffer.from(JSON.stringify(req.body), "utf8");
    logger.warn(
      "webhook: using JSON.stringify(req.body) fallback for signature verification — use express.raw for exact bytes"
    );
  } else if (req.body && typeof req.body === "string") {
    rawBuf = Buffer.from(req.body, "utf8");
  } else {
    // cannot obtain body bytes
    logger.warn("webhook: no raw body available for verification");
    return false;
  }

  // 1) Content-Digest
  const contentDigestHeader =
    req.headers["content-digest"] || req.headers["Content-Digest"];
  if (!contentDigestHeader) {
    logger.warn("missing content-digest header");
    return false;
  }
  const digestValue = parseHeaderRightSide(contentDigestHeader).replace(
    /^"|"$/g,
    ""
  );

  let digestOk = false;
  if (isProbableHex(digestValue)) {
    const computedHex = sha256Hex(rawBuf);
    digestOk =
      timingSafeEq(computedHex, digestValue.toLowerCase()) ||
      timingSafeEq(computedHex, digestValue);
  } else {
    // header might be "SHA-256=<base64>" or just base64
    const computedB64 = sha256Base64(rawBuf);
    digestOk = timingSafeEq(computedB64, digestValue);
  }
  if (!digestOk) {
    logger.warn("content-digest verification failed");
    return false;
  }

  // 2) Signature verification using signature-input
  const signatureInputRaw =
    req.headers["signature-input"] || req.headers["Signature-Input"];
  const signatureHeaderRaw =
    req.headers["signature"] || req.headers["Signature"];
  if (!signatureInputRaw || !signatureHeaderRaw) {
    logger.warn("missing signature-input or signature header");
    return false;
  }
  const fields = parseSigInput(signatureInputRaw);
  if (!fields) {
    logger.warn("failed to parse signature-input");
    return false;
  }

  const canonical = buildCanonicalString(req, fields);

  // extract sig1 value. support sig1=:BASE64: and sig1=HEX
  let sigVal = null;
  const base64Match = signatureHeaderRaw.match(/sig1=:(.+?):/);
  if (base64Match) sigVal = base64Match[1];
  else {
    const m = signatureHeaderRaw.match(/sig1=([^\s,;]+)/);
    if (m) sigVal = m[1];
  }
  if (!sigVal) {
    logger.warn("signature header parse failed");
    return false;
  }

  // compute HMAC with your secret
  if (!WEBHOOK_SECRET) {
    logger.error("WEBHOOK_SECRET not set");
    return false;
  }

  let sigOk = false;
  if (isProbableHex(sigVal)) {
    const computedHex = hmacSha256Hex(WEBHOOK_SECRET, canonical);
    sigOk =
      timingSafeEq(computedHex, sigVal.toLowerCase()) ||
      timingSafeEq(computedHex, sigVal);
  } else {
    const computedB64 = hmacSha256Base64(WEBHOOK_SECRET, canonical);
    sigOk = timingSafeEq(computedB64, sigVal);
  }
  if (!sigOk) {
    logger.warn("signature HMAC verification failed");
    return false;
  }
  return true;
}

// Minimal retry helper if user doesn't have one. Uses exponential backoff.
async function _retry(fn, opts = { retries: 3, delay: 500, factor: 2 }) {
  const { retries, delay, factor } = opts;
  let attempt = 0;
  let err;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e) {
      err = e;
      attempt++;
      if (attempt > retries) break;
      const wait = Math.floor(delay * Math.pow(factor, attempt - 1));
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw err;
}

// Minimal throttle placeholder if you do not have a proper throttle. Replace with your limiter.
let lastCallTs = 0;
async function _throttle(minIntervalMs = 100) {
  const now = Date.now();
  const diff = now - lastCallTs;
  if (diff < minIntervalMs) {
    await new Promise((r) => setTimeout(r, minIntervalMs - diff));
  }
  lastCallTs = Date.now();
}

export {
  isProbableBase64,
  _throttle,
  _retry,
  verifyRequest,
  sha256Hex,
  sha256Base64,
  hmacSha256Hex,
  hmacSha256Base64,
  timingSafeEq,
};
