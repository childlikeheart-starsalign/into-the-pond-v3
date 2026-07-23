"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDeletionWebRequestRateLimited = isDeletionWebRequestRateLimited;
exports.__rateLimitConfig = __rateLimitConfig;
const firestore_1 = require("firebase-admin/firestore");
const init_1 = require("../init");
const deletionCrypto_1 = require("./deletionCrypto");
const MAX_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;
/**
 * Returns true if the request should be treated as rate-limited (caller still
 * returns the generic success message — no enumeration).
 */
async function isDeletionWebRequestRateLimited(params) {
  const emailKey = `email_${(0, deletionCrypto_1.hashEmailForLookup)(params.email)}`;
  const ipKey =
    params.clientIp && params.clientIp !== "unknown"
      ? `ip_${params.clientIp.replace(/[^a-zA-Z0-9:.]/g, "_").slice(0, 64)}`
      : null;
  const emailLimited = await bumpRateBucket(emailKey);
  if (emailLimited) return true;
  if (ipKey) {
    return bumpRateBucket(ipKey);
  }
  return false;
}
async function bumpRateBucket(docId) {
  const ref = init_1.db.collection("deletion_web_rate_limits").doc(docId);
  const now = Date.now();
  return init_1.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() ?? {};
    let windowStart = typeof data.windowStartMs === "number" ? data.windowStartMs : now;
    let count = typeof data.count === "number" ? data.count : 0;
    if (now - windowStart >= WINDOW_MS) {
      windowStart = now;
      count = 0;
    }
    if (count >= MAX_PER_HOUR) {
      return true;
    }
    tx.set(
      ref,
      {
        count: count + 1,
        windowStartMs: windowStart,
        updatedAt: firestore_1.Timestamp.now(),
        // TTL-ish hint for optional later cleanup jobs
        expireAt: firestore_1.Timestamp.fromMillis(windowStart + WINDOW_MS * 2),
      },
      { merge: true },
    );
    return false;
  });
}
/** Test helper — not used in production call path. */
function __rateLimitConfig() {
  return { MAX_PER_HOUR, WINDOW_MS };
}
