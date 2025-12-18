import {
  logger,
  retry,
  throttle,
  isDuplicate,
  saveStore,
  loadStore,
  hubspotClient as hs,
  isProbableBase64,
  _throttle,
  _retry,
  verifyRequest,
  sha256Hex,
  sha256Base64,
  hmacSha256Hex,
  hmacSha256Base64,
  timingSafeEq,
  getFormAnswerGroup,
  executeWithRetryAndThrottle,
  extractFormAnswers,
  getHubspotClient,
  hubspotmapper,
  createHubspotContact,
} from "../index.js";

// async function webhookHandleFN(req, res) {
//   try {
//     const payload = req.body;
//     // const signature = req.headers["x-signature"]; // depends on provider

//     // 1. Verify signature (pseudo)
//     // if (!isValidSignature(payload, signature)) {
//     //   return res.status(401).send("Invalid signature");
//     // }

//     // 2. ACK immediately
//     res.status(200).json({ received: true });

//     // 3. Process async (DON’T block webhook)

//     const resourceId = payload.resource_id;

//     // 1. Idempotency check
//     if (isDuplicate(resourceId)) {
//       logger.info(`Skipping duplicate webhook: ${resourceId}`);
//       return;
//     }

//     // 2. Throttle before outgoing calls
//     await throttle();

//     // 3. Retry protected API call
//     await retry(
//       async () => {
//         // Example external API call
//         await processWebhookAsync(payload);
//       },
//       {
//         retries: 4,
//         delay: 500,
//         factor: 2,
//       }
//     );
//     // processWebhookAsync(payload);
//   } catch (error) {
//     logger.error("Webhook error:", error);
//     res.status(500).send("Webhook failed");
//   }
// }

// async function processWebhookAsync(payload) {
//   try {
//     logger.info(`Webhook processed successfully: ${resourceId}`);
//   } catch (error) {
//     logger.error("Webhook processing failed:", {
//       message: error.message,
//       stack: error.stack,
//       payload,
//     });

//     // Optional: store failed event for later reprocessing
//     // await storeFailedWebhook(payload, error);
//   }
// }

// env
const HEALTHIE_API = "https://api.gethealthie.com/graphql";
const API_KEY = process.env.HEALTHIE_API_KEY;
const WEBHOOK_SECRET = process.env.HEALTHIE_WEBHOOK_SECRET;

// --- Main handler (drop-in) ---
async function webhookHandleFN(req, res) {
  try {
    // Use req.rawBody if available (set by express.raw); otherwise will fallback as implemented.
    // const verified = verifyRequest(req);
    // if (!verified) {
    //   res.status(401).send("invalid signature/digest");
    //   // log and stop
    //   logger.warn("webhook verification failed; responding 401");
    //   return;
    // }

    // ACK fast
    res.status(200).json({ received: true });

    // Parse payload safely from rawBody or req.body
    let payload;
    try {
      if (req.rawBody && Buffer.isBuffer(req.rawBody))
        payload = JSON.parse(req.rawBody.toString("utf8"));
      else if (req.body && typeof req.body === "object") payload = req.body;
      else if (req.body && typeof req.body === "string")
        payload = JSON.parse(req.body);
      else payload = {};
    } catch (err) {
      // parsing failed — log & stop processing
      logger.error("webhook: failed to parse JSON payload", err);
      return;
    }

    // extract canonical identifiers
    const resourceId = payload.resource_id ?? payload.data?.id ?? null;
    const eventType = payload.event_type ?? payload.type ?? null;

    if (!resourceId) {
      logger.warn("webhook: no resource_id found — nothing to process");
      return;
    }

    // 1) Idempotency check: isDuplicate() must be implemented by you (DB/redis). If missing, fallback to no-dup check (not recommended).
    // if (typeof isDuplicate === "function") {
    //   const dup = isDuplicate(resourceId, eventType);

    //   if (dup) {
    //     logger.info(`Skipping duplicate webhook: ${resourceId} (${eventType})`);
    //     return;
    //   }
    // } else {
    //   logger.warn(
    //     "isDuplicate() not implemented — running without idempotency"
    //   );
    // }

    await processWebhookAsync(payload);

    // 2) Throttle before outgoing calls
    // if (typeof throttle === "function") {
    //   await throttle();
    // } else {
    //   await _throttle(100); // basic fallback throttle
    // }

    // 3) Retry-protected processing, Retry for entire webhook processing
    // const retryFn =
    //   typeof retry === "function"
    //     ? (fn, opts) => retry(fn, opts)
    //     : (fn, opts) => _retry(fn, opts);

    // await retryFn(
    //   async () => {
    //     await processWebhookAsync(payload);
    //   },
    //   { retries: 4, delay: 500, factor: 2 }
    // );
  } catch (error) {
    // If we failed before ACK, send 500; after ACK we already returned 200 so can't change client response.
    logger.error("Webhook handler threw:", error);
    try {
      if (!res.headersSent) res.status(500).send("Webhook failed");
    } catch {}
    // record failure to monitoring
  }
}

// --- business processing: fetch from Healthie GraphQL and run logic ---
async function processWebhookAsync(payload) {
  const resourceId = payload.resource_id ?? payload.data?.id;
  const tagId = payload.tag_id ?? payload.data?.tag_id;
  const eventType = payload.event_type ?? payload.type;

  try {
    // Ensure API key exists
    // if (!API_KEY) {
    //   logger.error("HEALTHIE_API_KEY not set");
    //   return;
    // }

    // Main logic for webhook handler
    // retrieve the full response set.
    const fromAnswer = await executeWithRetryAndThrottle(
      () => getFormAnswerGroup(resourceId),
      {
        retries: 3,
        context: {
          service: "healthie",
          operation: "GetFormAnswerGroup",
          formAnswerGroupId: resourceId,
        },
      }
    );

    // let normalized = await executeWithRetryAndThrottle(() => {
    //   extractFormAnswers(fromAnswer),
    //     {
    //       retries: 3,
    //       context: {
    //         service:
    //           "extractFormAnswers from Healthie Response using jsdom module",
    //         operation: "extractFormAnswers",
    //         formAnswerGroupId: resourceId,
    //       },
    //     };
    // });

    let normalized = extractFormAnswers(fromAnswer);

    // let normalized = extractFormAnswers(fromAnswer);
    // logger.info(`Normalized : ${JSON.stringify(normalized)}`);
    console.log("Normalized Answers :", normalized);

    const payload = hubspotmapper(normalized, resourceId);

    console.log("payload Mapping :", payload);

    const client = await getHubspotClient();

    if (payload.email && payload) {
      const contact = await client.contacts.upsertContactByEmail(
        payload.email,
        payload
      );
      logger.info(`Contact created: ${JSON.stringify(contact, null, 2)}`);
    }
  } catch (err) {
    // You MUST persist failed events for later reprocessing (DLQ). Replace with your store.
    logger.error("processWebhookAsync failed:", err);
    // optional: await storeFailedWebhook(payload, err);
    // throw err; // let caller's retry logic handle it
  }
}

export { webhookHandleFN, processWebhookAsync };
