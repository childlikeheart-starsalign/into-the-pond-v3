import assert from "node:assert/strict";
import { test } from "node:test";

import {
  classifyClaimError,
  shouldClearCastAfterClaimFailure,
} from "@/src/features/fishing/claimCastErrors";
import { shouldShowCatalogRarityRingOverlay } from "@/src/features/fishing/claimCeremony";
import { buildClaimCelebrationCopy } from "@/src/features/fishing/claimCelebrationCopy";
import {
  claimCelebrationShellOpacity,
  FIELD_NOTE_REVEAL_TOTAL_MS,
  fieldNoteRevealDelays,
} from "@/src/features/fishing/claimCelebrationReveal";
import { stockForUiBaitId } from "@/src/features/fishing/baitStock";
import { mergeServerCastWithLocalCache } from "@/src/features/fishing/mergeServerCastCache";

test("classifyClaimError defaults unclassified to retrySafe", () => {
  const result = classifyClaimError(new Error("something odd happened"));
  assert.equal(result.retrySafe, true);
  assert.equal(result.terminal, false);
});

test("classifyClaimError treats no active cast as terminal", () => {
  const result = classifyClaimError(new Error("No active cast to claim"));
  assert.equal(result.terminal, true);
  assert.equal(result.retrySafe, false);
});

test("shouldClearCastAfterClaimFailure clears on terminal", () => {
  assert.equal(
    shouldClearCastAfterClaimFailure({ terminal: true, serverHasActiveCast: true }),
    true,
  );
});

test("shouldClearCastAfterClaimFailure clears when server has no cast", () => {
  assert.equal(
    shouldClearCastAfterClaimFailure({ terminal: false, serverHasActiveCast: false }),
    true,
  );
});

test("shouldClearCastAfterClaimFailure keeps cache on non-terminal with active cast", () => {
  assert.equal(
    shouldClearCastAfterClaimFailure({ terminal: false, serverHasActiveCast: true }),
    false,
  );
});

test("mergeServerCastWithLocalCache keeps castingLabel for the same castId", () => {
  const merged = mergeServerCastWithLocalCache(
    {
      castId: "c1",
      readyAt: 1,
      rodIdAtCast: "basic",
      baitIdAtCast: "bait_basic",
      castingLabel: "first cast copy",
      mode: "server",
    },
    {
      castId: "c1",
      readyAt: 2,
      rodIdAtCast: "basic",
      baitIdAtCast: "bait_basic",
      mode: "server",
    },
  );
  assert.equal(merged.castingLabel, "first cast copy");
  assert.equal(merged.readyAt, 2);
});

test("mergeServerCastWithLocalCache drops castingLabel when castId changes", () => {
  const merged = mergeServerCastWithLocalCache(
    {
      castId: "old",
      readyAt: 1,
      rodIdAtCast: "basic",
      baitIdAtCast: "bait_basic",
      castingLabel: "stale label",
    },
    {
      castId: "new",
      readyAt: 2,
      rodIdAtCast: "basic",
      baitIdAtCast: "bait_basic",
      mode: "server",
    },
  );
  assert.equal(merged.castingLabel, undefined);
});

test("classifyClaimError keeps auth failures retry-safe without auto-retry", () => {
  const error = Object.assign(new Error("Auth required"), {
    code: "functions/unauthenticated",
  });
  const result = classifyClaimError(error);
  assert.equal(result.retrySafe, true);
  assert.equal(result.terminal, false);
  assert.equal(result.autoRetry, false);
});

test("classifyClaimError signed-in auth failure uses service-reach message", () => {
  const error = Object.assign(new Error("Auth required"), {
    code: "functions/unauthenticated",
  });
  const result = classifyClaimError(error, { signedIn: true });
  assert.equal(result.message, "Couldn't reach the fishing service.\nTry again in a moment.");
  assert.equal(result.autoRetry, false);
});

test("classifyClaimError signed-out auth failure asks to sign in", () => {
  const error = Object.assign(new Error("Auth required"), {
    code: "functions/unauthenticated",
  });
  const result = classifyClaimError(error, { signedIn: false });
  assert.equal(result.message, "Sign in again to reel in your cast.");
  assert.equal(result.autoRetry, false);
});

test("buildClaimCelebrationCopy uses field-journal voice", () => {
  const copy = buildClaimCelebrationCopy({
    outcome: "catch",
    rarityIndicator: "common",
    creatureTypeId: "puddle-dart",
    creatureDisplayName: "Puddle Dart",
    wonderAwarded: 2,
    materialsAwarded: 1,
    claimedAt: 1_700_000_000_000,
  });
  assert.equal(copy.title, "A visitor from the pond");
  assert.equal(copy.speciesName, "Puddle Dart");
  assert.ok(copy.fieldNote.length > 0);
  assert.ok(copy.fieldNote.length <= 100);
  assert.doesNotMatch(copy.fieldNote, /\+/);
  // Prefer catalog visualMetaphor when the creature exists.
  assert.match(copy.fieldNote, /coin-bright|surface|reflection/i);
  assert.equal(copy.closingLine, "A new page has settled into your journal.");
  assert.equal(copy.rewardLines.length, 2);
  assert.deepEqual(copy.rewardLines[0], {
    kind: "wonder",
    label: "Wonder increased",
    amount: 2,
  });
  assert.deepEqual(copy.rewardLines[1], {
    kind: "materials",
    label: "Driftwood collected",
    amount: 1,
  });
  for (const line of copy.rewardLines) {
    assert.doesNotMatch(line.label, /^\+\d/);
    assert.doesNotMatch(line.label, /materials/i);
  }
  assert.doesNotMatch(copy.closingLine, /\d+\/\d+/);
  assert.doesNotMatch(copy.closingLine, /%/);
});

test("buildClaimCelebrationCopy closingLine for duplicate outcome", () => {
  const copy = buildClaimCelebrationCopy({
    outcome: "duplicate",
    rarityIndicator: "rare",
    creatureTypeId: "cinder-veil",
    creatureDisplayName: "Cinder Veil",
    wonderAwarded: 1,
    materialsAwarded: 0,
    claimedAt: 1_700_000_000_000,
  });
  assert.equal(copy.title, "A familiar visitor");
  assert.equal(copy.closingLine, "Another page, well-worn and welcome.");
  assert.ok(copy.closingLine.length > 0);
});

test("buildClaimCelebrationCopy falls back when creature id unknown", () => {
  const copy = buildClaimCelebrationCopy({
    outcome: "catch",
    rarityIndicator: "common",
    creatureTypeId: "not-in-catalog",
    creatureDisplayName: "Ripple Minnow",
    wonderAwarded: 0,
    materialsAwarded: 0,
    claimedAt: 1_700_000_000_000,
  });
  assert.equal(copy.speciesName, "Ripple Minnow");
  assert.ok(copy.fieldNote.length > 0);
  assert.ok(copy.fieldNote.length <= 100);
});

test("buildClaimCelebrationCopy omits quiet record when nothing gathered", () => {
  const copy = buildClaimCelebrationCopy({
    outcome: "miss",
    rarityIndicator: "common",
    wonderAwarded: 0,
    materialsAwarded: 0,
    claimedAt: 1_700_000_000_000,
  });
  assert.equal(copy.title, "The pond answered gently");
  assert.equal(copy.speciesName, null);
  assert.deepEqual(copy.rewardLines, []);
  assert.equal(copy.closingLine, "The journal waits, unhurried.");
  assert.ok(copy.fieldNote.length > 0);
  assert.ok(copy.fieldNote.length <= 100);
  assert.doesNotMatch(copy.closingLine, /\d+\/\d+/);
});

test("stockForUiBaitId maps mid/premium and leaves basic free", () => {
  assert.equal(stockForUiBaitId("bait_basic", { scaleBait: 0, glimmerdustBait: 0 }), null);
  assert.equal(stockForUiBaitId("bait_mid", { scaleBait: 3, glimmerdustBait: 0 }), 3);
  assert.equal(stockForUiBaitId("bait_premium", { scaleBait: 0, glimmerdustBait: 1 }), 1);
});

test("field note reveal totals 2000ms with catch and miss stagger", () => {
  assert.equal(FIELD_NOTE_REVEAL_TOTAL_MS, 2000);
  const catchDelays = fieldNoteRevealDelays(true);
  const missDelays = fieldNoteRevealDelays(false);
  assert.equal(catchDelays.cta + 200, FIELD_NOTE_REVEAL_TOTAL_MS);
  assert.equal(missDelays.cta + 200, FIELD_NOTE_REVEAL_TOTAL_MS);
  assert.equal(missDelays.body, catchDelays.species);
  assert.ok(missDelays.body < catchDelays.body);
});

test("claim celebration shell stays visible during pond ripple ceremony", () => {
  assert.equal(claimCelebrationShellOpacity(true), 1);
  assert.equal(claimCelebrationShellOpacity(false), 1);
});

test("shouldShowCatalogRarityRingOverlay shows ring until reveal ready", () => {
  assert.equal(shouldShowCatalogRarityRingOverlay({ claimRevealReady: false }), true);
  assert.equal(shouldShowCatalogRarityRingOverlay({ claimRevealReady: true }), false);
});

/** Mirrors useFishingCraftSounds.playClaimOutcome slot selection. */
function claimOutcomeSoundSlot(claim: {
  outcome: string;
  metadata?: { reason?: string } | Record<string, unknown>;
}): string {
  if (claim.outcome === "catch") return "claimCatch";
  if (claim.outcome === "duplicate") return "claimDuplicate";
  const reason =
    claim.metadata && typeof claim.metadata === "object" && "reason" in claim.metadata
      ? String((claim.metadata as { reason?: string }).reason ?? "")
      : "";
  if (reason === "wonder_gate") return "claimMissWonderGate";
  return "claimMissChance";
}

test("claim outcome SFX routing matches server outcomes", () => {
  assert.equal(claimOutcomeSoundSlot({ outcome: "catch" }), "claimCatch");
  assert.equal(claimOutcomeSoundSlot({ outcome: "duplicate" }), "claimDuplicate");
  assert.equal(claimOutcomeSoundSlot({ outcome: "miss" }), "claimMissChance");
  assert.equal(
    claimOutcomeSoundSlot({ outcome: "miss", metadata: { reason: "wonder_gate" } }),
    "claimMissWonderGate",
  );
  assert.equal(
    claimOutcomeSoundSlot({ outcome: "miss", metadata: { reason: "chance" } }),
    "claimMissChance",
  );
});

test("live client miss with summary metadata.reason routes wonder_gate SFX", () => {
  // Mirrors toClientClaimSummary output after claimCast.
  assert.equal(
    claimOutcomeSoundSlot({ outcome: "miss", metadata: { reason: "wonder_gate" } }),
    "claimMissWonderGate",
  );
});

test("live client miss without metadata uses claimMissChance", () => {
  assert.equal(claimOutcomeSoundSlot({ outcome: "miss" }), "claimMissChance");
});
