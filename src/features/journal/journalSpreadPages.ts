import { FIELD_JOURNAL_CHAPTERS } from "@/src/features/fieldJournal/fieldJournalChapters";

/** All spread assets in chapter order (excludes cover). */
export const JOURNAL_SPREAD_PAGES = FIELD_JOURNAL_CHAPTERS.flatMap((chapter) =>
  chapter.spreads.map((spread) => spread.asset),
);
