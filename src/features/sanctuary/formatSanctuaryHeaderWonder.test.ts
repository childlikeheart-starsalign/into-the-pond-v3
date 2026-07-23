import {
  formatWonderAccessibilityLabel,
  formatWonderLabel,
  splitWonderLabelForDisplay,
} from "./formatSanctuaryHeaderWonder";

const testGlobal = globalThis as typeof globalThis & { __DEV__?: boolean };
if (testGlobal.__DEV__ === undefined) {
  testGlobal.__DEV__ = true;
}

function assertEqual(actual: string, expected: string, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected "${expected}", got "${actual}"`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runFormatSanctuaryHeaderWonderSelfTest(): void {
  assertEqual(formatWonderLabel(12), "12", "prod label without preview");
  assertEqual(
    formatWonderAccessibilityLabel(12),
    "Wonder: 12",
    "prod accessibility without preview",
  );

  if (__DEV__) {
    assertEqual(formatWonderLabel(12, 12), "12*", "dev label with preview marker");
    assertEqual(
      formatWonderAccessibilityLabel(12, 12),
      "Wonder: 12, includes 12 preview-only balance not yet saved",
      "dev accessibility with preview",
    );
    const split = splitWonderLabelForDisplay("12*");
    assertEqual(split.text, "12", "split text");
    assert(split.showPreviewMarker, "split marker flag");
  }

  const plain = splitWonderLabelForDisplay("999");
  assertEqual(plain.text, "999", "plain split text");
  assert(!plain.showPreviewMarker, "plain split no marker");
}

if (require.main === module) {
  runFormatSanctuaryHeaderWonderSelfTest();
  console.log("formatSanctuaryHeaderWonder self-test passed");
}
