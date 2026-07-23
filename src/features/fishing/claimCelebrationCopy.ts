import {
  MISS_CHANCE_MESSAGES,
  pickMessageVariant,
} from "@/shared/sanctuary/fishing/fishingOutcomeMessages";
import { getCreatureByTypeId } from "@/src/data/creatures/helpers";
import type { ServerClaimSummary } from "@/src/services/firebase/serverActions";

export type QuietRewardLine = {
  kind: "wonder" | "materials";
  /** What happened — read first. */
  label: string;
  /** Subordinate amount shown as (+N), never leading. */
  amount: number;
};

/** Field-journal page copy for a claimed cast — observational, not loot. */
export type ClaimCelebrationCopy = {
  /** Naturalist journal heading. */
  title: string;
  /** Species name; null on a miss. */
  speciesName: string | null;
  /** Short italic observation (≤100 chars). */
  fieldNote: string;
  rewardLines: QuietRewardLine[];
  /** Quiet journal settle line before Continue. */
  closingLine: string;
};

const FIELD_NOTE_MAX = 100;

const NEW_CATCH_CLOSING_LINE = "A new page has settled into your journal.";
const DUPLICATE_CLOSING_LINE = "Another page, well-worn and welcome.";
const MISS_CLOSING_LINE = "The journal waits, unhurried.";
// Approved 2026-07-21 — cast-finish field-note closing lines (implementation plan §4).

const NEW_CATCH_FIELD_NOTES = [
  "Prefers quiet mornings beneath the lilies.",
  "Appears only when the pond has forgotten to hurry.",
  "Often found where the reeds lean together.",
  "Drawn to still water after rainfall.",
  "Lingers just long enough to be noted, then slips away.",
] as const;

const DUPLICATE_FIELD_NOTES = [
  "Returns to familiar shallows when the light softens.",
  "Recognizes the same stretch of bank.",
  "Keeps to the quiet edge, as before.",
  "A second visit, no less carefully observed.",
  "Settles into the same patient rhythm.",
] as const;

const MISS_FIELD_NOTES = [
  "The water stayed quiet today.",
  "Nothing stirred — and that felt alright.",
  "The pond held its secrets a little longer.",
  "Patience has its own rhythm here.",
  "Still, the waiting itself felt worthwhile.",
] as const;

function clampFieldNote(note: string): string {
  const trimmed = note.trim();
  if (trimmed.length <= FIELD_NOTE_MAX) return trimmed;
  return `${trimmed.slice(0, FIELD_NOTE_MAX - 1).trimEnd()}…`;
}

function buildRewardLines(claim: ServerClaimSummary): QuietRewardLine[] {
  const lines: QuietRewardLine[] = [];
  if (claim.wonderAwarded > 0) {
    lines.push({
      kind: "wonder",
      label: "Wonder increased",
      amount: claim.wonderAwarded,
    });
  }
  if (claim.materialsAwarded > 0) {
    lines.push({
      kind: "materials",
      label: "Driftwood collected",
      amount: claim.materialsAwarded,
    });
  }
  return lines;
}

function missFieldNote(claim: ServerClaimSummary, seed: string): string {
  const spirit = claim.spiritMessage?.trim();
  if (spirit && spirit.length > 0 && spirit.length <= FIELD_NOTE_MAX) {
    return spirit;
  }
  return clampFieldNote(
    pickMessageVariant(seed, MISS_FIELD_NOTES) ||
      pickMessageVariant(seed, MISS_CHANCE_MESSAGES) ||
      "Not this time. The water remembers your patience.",
  );
}

/** Prefer catalog visualMetaphor; fall back to generic banks if lookup fails. */
function creatureFieldNote(
  claim: ServerClaimSummary,
  seed: string,
  fallbackBank: readonly string[],
): string {
  const creature = getCreatureByTypeId(claim.creatureTypeId);
  const metaphor = creature?.visualMetaphor?.trim();
  if (metaphor) return clampFieldNote(metaphor);
  return clampFieldNote(pickMessageVariant(seed, fallbackBank) || fallbackBank[0]!);
}

export function buildClaimCelebrationCopy(
  claim: ServerClaimSummary,
  seed = claim.creatureTypeId ?? claim.outcome,
): ClaimCelebrationCopy {
  const rewardLines = buildRewardLines(claim);

  if (claim.outcome === "catch" && claim.creatureDisplayName) {
    return {
      title: "A visitor from the pond",
      speciesName: claim.creatureDisplayName,
      fieldNote: creatureFieldNote(claim, seed, NEW_CATCH_FIELD_NOTES),
      rewardLines,
      closingLine: NEW_CATCH_CLOSING_LINE,
    };
  }

  if (claim.outcome === "duplicate" && claim.creatureDisplayName) {
    return {
      title: "A familiar visitor",
      speciesName: claim.creatureDisplayName,
      fieldNote: creatureFieldNote(claim, seed, DUPLICATE_FIELD_NOTES),
      rewardLines,
      closingLine: DUPLICATE_CLOSING_LINE,
    };
  }

  return {
    title: "The pond answered gently",
    speciesName: null,
    fieldNote: missFieldNote(claim, seed),
    rewardLines,
    closingLine: MISS_CLOSING_LINE,
  };
}
