import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "webhook-events.json");
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function cleanupExpired(store) {
  const now = Date.now();

  for (const [eventId, timestamp] of Object.entries(store)) {
    if (now - timestamp > TTL_MS) {
      delete store[eventId];
    }
  }
}

/**
 * Returns true if duplicate
 */
// function isDuplicate(eventId) {
//   if (!eventId) return false;

//   const store = loadStore();

//   cleanupExpired(store);

//   if (store[eventId]) {
//     return true;
//   }

//   store[eventId] = Date.now();
//   saveStore(store);

//   return false;
// }

function isDuplicate(resourceId, eventType) {
  if (!resourceId) return false;

  const key = `${resourceId}:${eventType}`;

  const store = loadStore();
  cleanupExpired(store);

  if (store[key]) {
    return true;
  }

  store[key] = Date.now();
  saveStore(store);

  return false;
}

export { isDuplicate, saveStore, loadStore };
