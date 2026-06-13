import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { SpreadImagePreloader } from "@/src/components/fieldJournal/FieldJournalSpread";
import {
  fitJournalSceneRect,
  journalBookPageFrameRect,
  type FitRect,
} from "@/src/features/fieldJournal/fitContainRect";
import { SkiaPageCurlOverlay } from "@/src/features/journal/SkiaPageCurlOverlay";
import type { FieldJournalSpread } from "@/src/features/fieldJournal/types";
import type { SpreadWindowEntry } from "@/src/features/fieldJournal/useSpreadWindow";

type JournalViewerProps = {
  width: number;
  height: number;
  spreads: FieldJournalSpread[];
  activeSpread: FieldJournalSpread;
  windowEntries: SpreadWindowEntry[];
  pageIndex: number;
  pageCount: number;
  reduceMotion: boolean;
  disabled: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onCommitStart: () => void;
  onLayoutRectsChange?: (rects: { sceneRect: FitRect; pageRect: FitRect }) => void;
};

export function JournalViewer({
  width,
  height,
  spreads,
  activeSpread,
  windowEntries,
  pageIndex,
  pageCount,
  reduceMotion,
  disabled,
  onSwipeLeft,
  onSwipeRight,
  onCommitStart,
  onLayoutRectsChange,
}: JournalViewerProps) {
  const sceneRect = useMemo(() => fitJournalSceneRect(width, height), [height, width]);
  const pageRect = useMemo(() => journalBookPageFrameRect(sceneRect), [sceneRect]);
  const nextSpread = pageIndex < pageCount - 1 ? spreads[pageIndex + 1]! : null;
  const prevSpread = pageIndex > 0 ? spreads[pageIndex - 1]! : null;

  useEffect(() => {
    onLayoutRectsChange?.({ sceneRect, pageRect });
  }, [onLayoutRectsChange, pageRect, sceneRect]);

  return (
    <View style={[styles.root, { width, height }]}>
      {windowEntries.map((entry) => (
        <SpreadImagePreloader key={`preload-${entry.spread.id}`} spread={entry.spread} />
      ))}

      <SkiaPageCurlOverlay
        width={width}
        height={height}
        sceneRect={sceneRect}
        pageRect={pageRect}
        currentSpread={activeSpread}
        nextSpread={nextSpread}
        prevSpread={prevSpread}
        canGoLeft={pageIndex < pageCount - 1}
        canGoRight={pageIndex > 0}
        disabled={disabled}
        reduceMotion={reduceMotion}
        onCommitStart={onCommitStart}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#0D0A07",
    overflow: "hidden",
  },
});
