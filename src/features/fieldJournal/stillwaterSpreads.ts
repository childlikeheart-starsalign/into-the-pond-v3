import { buildJournalSpread } from "@/src/features/fieldJournal/buildJournalSpread";
import { fieldJournalMedia } from "@/src/features/fieldJournal/fieldJournalMedia";
import { FIELD_JOURNAL_CHAPTER_SLOTS } from "@/src/features/fieldJournal/fieldJournalLayout";
import type { FieldJournalChapter } from "@/src/features/fieldJournal/types";

const spreads = fieldJournalMedia.stillwater;

/** Stillwater chapter — common creatures (net slots 0–29), three per spread. */
export const STILLWATER_CHAPTER: FieldJournalChapter = {
  id: "stillwater",
  label: "Stillwater Creatures",
  creatureStart: FIELD_JOURNAL_CHAPTER_SLOTS.stillwater.start,
  creatureEnd: FIELD_JOURNAL_CHAPTER_SLOTS.stillwater.end,
  spreads: [
    buildJournalSpread("stillwater-0-2", spreads.creatures0to2),
    buildJournalSpread("stillwater-3-5", spreads.creatures3to5),
    buildJournalSpread("stillwater-6-8", spreads.creatures6to8),
    buildJournalSpread("stillwater-9-11", spreads.creatures9to11),
    buildJournalSpread("stillwater-12-14", spreads.creatures12to14),
    buildJournalSpread("stillwater-15-17", spreads.creatures15to17),
    buildJournalSpread("stillwater-18-20", spreads.creatures18to20),
    buildJournalSpread("stillwater-21-23", spreads.creatures21to23),
    buildJournalSpread("stillwater-24-26", spreads.creatures24to26),
    buildJournalSpread("stillwater-27-29", spreads.creatures27to29),
  ],
};
