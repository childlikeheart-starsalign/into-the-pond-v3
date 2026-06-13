import { useEffect, useMemo } from "react";

import { evictSpreadImagesExcept } from "@/src/features/fieldJournal/spreadImageCache";
import type { FieldJournalSpread } from "@/src/features/fieldJournal/types";

export type SpreadWindowEntry = {
  spread: FieldJournalSpread;
  index: number;
  isActive: boolean;
};

/**
 * Returns current spread ± 1 for rendering; evicts GPU cache outside the window.
 */
export function useSpreadWindow(
  spreads: FieldJournalSpread[],
  currentIndex: number,
): SpreadWindowEntry[] {
  const windowEntries = useMemo(() => {
    const indices = new Set<number>();
    for (let i = currentIndex - 1; i <= currentIndex + 1; i += 1) {
      if (i >= 0 && i < spreads.length) indices.add(i);
    }
    return [...indices]
      .sort((a, b) => a - b)
      .map((index) => ({
        spread: spreads[index]!,
        index,
        isActive: index === currentIndex,
      }));
  }, [spreads, currentIndex]);

  useEffect(() => {
    const keepIds = new Set(windowEntries.map((entry) => entry.spread.id));
    evictSpreadImagesExcept(keepIds);
  }, [windowEntries]);

  return windowEntries;
}
