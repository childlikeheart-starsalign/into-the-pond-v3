import { buildJournalSpread } from "@/src/features/fieldJournal/buildJournalSpread";
import { fieldJournalMedia } from "@/src/features/fieldJournal/fieldJournalMedia";
import { FIELD_JOURNAL_CHAPTER_SLOTS } from "@/src/features/fieldJournal/fieldJournalLayout";
import type { FieldJournalChapter } from "@/src/features/fieldJournal/types";

const spreads = fieldJournalMedia.stillwater;

/**
 * Deep Current chapter — rare-tier organisms (net slots 30–99).
 * Uses full-scene spreads clipped to the page slot (same path as stillwater).
 */
export const DEEP_CURRENT_CHAPTER: FieldJournalChapter = {
  id: "deep-current",
  label: "Deep Current Organisms",
  creatureStart: FIELD_JOURNAL_CHAPTER_SLOTS["deep-current"].start,
  creatureEnd: FIELD_JOURNAL_CHAPTER_SLOTS["deep-current"].end,
  spreads: [
    buildJournalSpread("deep-current-30-32", spreads.creatures30to32),
    buildJournalSpread("deep-current-33-35", spreads.creatures33to35),
    buildJournalSpread("deep-current-36-38", spreads.creatures36to38),
    buildJournalSpread("deep-current-39-41", spreads.creatures39to41),
    buildJournalSpread("deep-current-42-43", spreads.creatures42to43),
    buildJournalSpread("deep-current-44-46", spreads.creatures44to46),
    buildJournalSpread("deep-current-47-49", spreads.creatures47to49),
    buildJournalSpread("deep-current-50-52", spreads.creatures50to52),
    buildJournalSpread("deep-current-53-55", spreads.creatures53to55),
    buildJournalSpread("deep-current-56-57", spreads.creatures56to57),
    buildJournalSpread("deep-current-58-60", spreads.creatures58to60),
    buildJournalSpread("deep-current-61-63", spreads.creatures61to63),
    buildJournalSpread("deep-current-64-66", spreads.creatures64to66),
    buildJournalSpread("deep-current-67-69", spreads.creatures67to69),
    buildJournalSpread("deep-current-70-71", spreads.creatures70to71),
    buildJournalSpread("deep-current-72-74", spreads.creatures72to74),
  ],
};
