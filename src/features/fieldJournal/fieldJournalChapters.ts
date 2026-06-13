import { DEEP_CURRENT_CHAPTER } from "@/src/features/fieldJournal/deepCurrentSpreads";
import { STILLWATER_CHAPTER } from "@/src/features/fieldJournal/stillwaterSpreads";
import type { FieldJournalChapter, FieldJournalChapterId } from "@/src/features/fieldJournal/types";

export const FIELD_JOURNAL_CHAPTERS: FieldJournalChapter[] = [
  STILLWATER_CHAPTER,
  DEEP_CURRENT_CHAPTER,
];

export function getFieldJournalChapter(
  chapterId: FieldJournalChapterId,
): FieldJournalChapter | null {
  return FIELD_JOURNAL_CHAPTERS.find((chapter) => chapter.id === chapterId) ?? null;
}

export function chapterForCreatureSlot(netSlotIndex: number): FieldJournalChapter | null {
  return (
    FIELD_JOURNAL_CHAPTERS.find(
      (chapter) => netSlotIndex >= chapter.creatureStart && netSlotIndex <= chapter.creatureEnd,
    ) ?? null
  );
}
