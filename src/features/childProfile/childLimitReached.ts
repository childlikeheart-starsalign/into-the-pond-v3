/** Pure client/server shared contract for createChildProfile limit rejection. */
export class ChildLimitReachedError extends Error {
  readonly code = "CHILD_LIMIT_REACHED" as const;
  constructor() {
    super("CHILD_LIMIT_REACHED");
    this.name = "ChildLimitReachedError";
  }
}

export function isChildLimitReachedError(err: unknown): boolean {
  if (err instanceof ChildLimitReachedError) return true;
  if (!err || typeof err !== "object") return false;
  const message = "message" in err ? String((err as { message: unknown }).message) : "";
  const details =
    "details" in err && (err as { details?: unknown }).details != null
      ? String((err as { details: unknown }).details)
      : "";
  return message.includes("CHILD_LIMIT_REACHED") || details.includes("CHILD_LIMIT_REACHED");
}
