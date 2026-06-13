import { DEFAULT_CREATURE_HOTSPOTS } from "@/src/features/fieldJournal/fieldJournalLayout";
import type { FieldJournalSpread } from "@/src/features/fieldJournal/types";

/** Scene spread; optional page crop for open_book_scene compositing. */
export function buildJournalSpread(
  id: string,
  asset: number,
  pageAsset?: number,
): FieldJournalSpread {
  return {
    id,
    asset,
    ...(pageAsset != null ? { pageAsset } : {}),
    hotspots: DEFAULT_CREATURE_HOTSPOTS,
  };
}
