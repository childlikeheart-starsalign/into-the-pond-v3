/** Synchronous session flag so guards see Enter before React re-renders. */
let celebrationSessionCompleteUid: string | null = null;

export function markCelebrationSessionComplete(uid: string): void {
  celebrationSessionCompleteUid = uid;
}

export function getSyncCelebrationComplete(uid: string | null): boolean {
  return uid != null && celebrationSessionCompleteUid === uid;
}

export function clearCelebrationSessionComplete(): void {
  celebrationSessionCompleteUid = null;
}
