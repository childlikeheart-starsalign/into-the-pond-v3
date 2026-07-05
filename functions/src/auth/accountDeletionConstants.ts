export const ACCOUNT_DELETION_GRACE_DAYS = 30;
export const ACCOUNT_DELETION_PAYLOAD_VERSION = 1;

/** PII subcollections removed immediately on deletion request (Phase 1). */
export const PII_SUBCOLLECTIONS = [
  "diaryEntries",
  "childAtlas",
  "wellState",
  "wellQuestions",
] as const;

export function isAccountDeletionEnabled(): boolean {
  return process.env.ACCOUNT_DELETION_ENABLED !== "false";
}

export function accountDeletionIdempotencyKey(requestId: string): string {
  return `account_deletion:${requestId.trim()}`;
}

export function purgeAtFromRequestedAt(requestedAtMs: number): Date {
  return new Date(requestedAtMs + ACCOUNT_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);
}
