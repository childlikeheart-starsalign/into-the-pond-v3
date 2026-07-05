let craftBenchSessionActive = false;
let castDuringCraftBenchSession = false;
let collectedThisBenchSession = false;

export function beginCraftBenchSession(): void {
  craftBenchSessionActive = true;
  castDuringCraftBenchSession = false;
  collectedThisBenchSession = false;
}

export function endCraftBenchSession(): void {
  craftBenchSessionActive = false;
  castDuringCraftBenchSession = false;
  collectedThisBenchSession = false;
}

export function markCollectedThisBenchSession(): void {
  if (craftBenchSessionActive) {
    collectedThisBenchSession = true;
  }
}

export function didCollectThisBenchSession(): boolean {
  return collectedThisBenchSession;
}

export function noteCastDuringCraftBenchSession(): void {
  if (craftBenchSessionActive) {
    castDuringCraftBenchSession = true;
  }
}

export function didCastDuringCraftBenchSession(): boolean {
  return castDuringCraftBenchSession;
}
