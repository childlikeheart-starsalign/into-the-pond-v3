/**
 * Cast timing — single source of truth for duration + cancel grace/rate limits.
 * Cloud Functions sync via functions/scripts/sync-fishing-module.js.
 * Client imports this module for display timing only; server enforces.
 */

/** Production cast wait (2 hours). Keep client FISHING_CAST_DURATION_MS in sync. */
export const CAST_DURATION_MS = 2 * 60 * 60 * 1000;

/** Quiet cancel window after cast create — server-enforced against createdAt. */
export const CANCEL_CAST_GRACE_MS = 15_000;

/** Max successful cancels per rolling window (anti cast+cancel cycling). */
export const CANCEL_CAST_MAX_PER_WINDOW = 3;

export const CANCEL_CAST_RATE_WINDOW_MS = 60 * 60 * 1000;
