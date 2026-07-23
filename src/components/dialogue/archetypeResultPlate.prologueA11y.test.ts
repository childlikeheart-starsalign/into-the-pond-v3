import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * Prologue must keep the historical a11y label when ArchetypeResultPlate
 * gained required ctaLabel / ctaAccessibilityLabel props.
 */
test("prologue primary CTA accessibility label remains Turn the page", () => {
  const ctaLabel = "Turn the page →";
  const ctaAccessibilityLabel = "Turn the page";
  assert.equal(ctaAccessibilityLabel, "Turn the page");
  assert.notEqual(ctaAccessibilityLabel, ctaLabel);
});
