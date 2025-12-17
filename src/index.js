import { logger } from "./utils/winston.logger.js";
import {
  webhookHandleFN,
  processWebhookAsync,
} from "./webhooks/webhookHandler.js";
import { retry } from "./utils/retry.js";
import { throttle } from "./utils/throttle.js";
import { isDuplicate, saveStore, loadStore } from "./utils/eventStore.js";
import { getFormAnswerGroup } from "./services/openloop.service.js";
import { executeWithRetryAndThrottle } from "./utils/executeWithRetryAndThrottle.js";

import { createHubspotContact } from "./services/hubspot.service.js";

import {
  axiosInstance,
  hubspotClient,
  getHubspotClient,
} from "./configs/hubspot.config.js";
// import { hubspotClient } from "./utils/hubspotClient.js";
import {
  isProbableBase64,
  _throttle,
  _retry,
  verifyRequest,
  sha256Hex,
  sha256Base64,
  hmacSha256Hex,
  hmacSha256Base64,
  timingSafeEq,
} from "./utils/helper.util.js";

import { normalizeKey } from "./utils/normalizeKey.js";
import { parseHtmlAnswer } from "./utils/parseHtmlAnswer.js";
import { coerceValue } from "./utils/coerceValue.js";
import { extractFormAnswers } from "./utils/extractFormAnswers.js";

import syncToHubspot from "./controllers/openLoopToHubspot.controller.js";
import {
  hubspotmapper,
  cleanProps,
  cleanPropsExtended,
  cleanPropsDeep,
} from "./utils/hubspotMapper.util.js";
// import {} from "";

export {
  createHubspotContact,
  getHubspotClient,
  cleanPropsExtended,
  cleanPropsDeep,
  syncToHubspot,
  hubspotmapper,
  cleanProps,
  logger,
  hubspotClient,
  axiosInstance,
  normalizeKey,
  extractFormAnswers,
  coerceValue,
  parseHtmlAnswer,
  webhookHandleFN,
  processWebhookAsync,
  retry,
  throttle,
  isDuplicate,
  saveStore,
  loadStore,
  getFormAnswerGroup,
  executeWithRetryAndThrottle,
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
