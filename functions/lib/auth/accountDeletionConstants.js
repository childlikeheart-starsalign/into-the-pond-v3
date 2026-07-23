"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PII_SUBCOLLECTIONS =
  exports.ACCOUNT_DELETION_PAYLOAD_VERSION =
  exports.ACCOUNT_DELETION_GRACE_DAYS =
    void 0;
exports.isAccountDeletionEnabled = isAccountDeletionEnabled;
exports.accountDeletionIdempotencyKey = accountDeletionIdempotencyKey;
exports.purgeAtFromRequestedAt = purgeAtFromRequestedAt;
exports.ACCOUNT_DELETION_GRACE_DAYS = 30;
exports.ACCOUNT_DELETION_PAYLOAD_VERSION = 1;
/** PII subcollections removed immediately on deletion request (Phase 1). */
exports.PII_SUBCOLLECTIONS = ["diaryEntries", "childAtlas", "wellState", "wellQuestions"];
function isAccountDeletionEnabled() {
  return process.env.ACCOUNT_DELETION_ENABLED === "true";
}
function accountDeletionIdempotencyKey(requestId) {
  return `account_deletion:${requestId.trim()}`;
}
function purgeAtFromRequestedAt(requestedAtMs) {
  return new Date(requestedAtMs + exports.ACCOUNT_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);
}
