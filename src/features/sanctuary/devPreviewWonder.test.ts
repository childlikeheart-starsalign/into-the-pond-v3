import { mergePreviewCreditKey, reconcilePreviewBalance } from "./devPreviewWonder";

function assertEqual(actual: number, expected: number, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runDevPreviewWonderSelfTest(): void {
  assertEqual(reconcilePreviewBalance(12, 0), 12, "no firestore increase keeps preview balance");
  assertEqual(
    reconcilePreviewBalance(12, 5),
    7,
    "partial firestore increase reduces preview balance",
  );
  assertEqual(
    reconcilePreviewBalance(12, 12),
    0,
    "matching firestore increase clears preview balance",
  );
  assertEqual(reconcilePreviewBalance(12, 20), 0, "large firestore increase floors at zero");
  assertEqual(reconcilePreviewBalance(0, 12), 0, "zero preview balance stays zero");
  assertEqual(reconcilePreviewBalance(8, -3), 8, "negative firestore delta is ignored");

  const first = mergePreviewCreditKey([], "well:q1:2026-07-09");
  assert(first.isNew, "first credit key is new");
  assertEqual(first.keys.length, 1, "first credit adds one key");

  const duplicate = mergePreviewCreditKey(first.keys, "well:q1:2026-07-09");
  assert(!duplicate.isNew, "duplicate credit key is rejected");
  assertEqual(duplicate.keys.length, 1, "duplicate credit does not grow key list");

  const second = mergePreviewCreditKey(first.keys, "fishing:cast_1");
  assert(second.isNew, "second distinct credit key is new");
  assertEqual(second.keys.length, 2, "second credit adds another key");
}

if (require.main === module) {
  runDevPreviewWonderSelfTest();
  console.log("devPreviewWonder self-test passed");
}
