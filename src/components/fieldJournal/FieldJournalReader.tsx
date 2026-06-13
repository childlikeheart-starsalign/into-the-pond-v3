import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JournalViewer } from "@/src/features/journal/JournalViewer";
import { colors, fontFamilies } from "@/src/constants/theme";
import {
  chapterStripHitRect,
  FIELD_JOURNAL_CHAPTER_TAB_IDS,
  imageNormalizedToFrameStyle,
  type FieldJournalChapterTabId,
} from "@/src/features/fieldJournal/fieldJournalHitRects";
import { getFieldJournalChapter } from "@/src/features/fieldJournal/fieldJournalChapters";
import {
  fitJournalSceneRect,
  journalBookPageFrameRect,
  type FitRect,
} from "@/src/features/fieldJournal/fitContainRect";
import { FIELD_JOURNAL_REFERENCE_WIDTH } from "@/src/features/fieldJournal/fieldJournalLayout";
import { STILLWATER_CHAPTER } from "@/src/features/fieldJournal/stillwaterSpreads";
import type { FieldJournalChapterId } from "@/src/features/fieldJournal/types";
import { useSpreadWindow } from "@/src/features/fieldJournal/useSpreadWindow";

type FieldJournalReaderProps = {
  width: number;
  height: number;
  isAnimating: boolean;
  onAnimatingChange: (value: boolean) => void;
  onPageTurn: () => void;
  onClose: () => void;
};

export function FieldJournalReader({
  width,
  height,
  isAnimating,
  onAnimatingChange,
  onPageTurn,
  onClose,
}: FieldJournalReaderProps) {
  const insets = useSafeAreaInsets();
  const [chapterId, setChapterId] = useState<FieldJournalChapterId>("stillwater");
  const [pageIndex, setPageIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [layoutRects, setLayoutRects] = useState<{
    sceneRect: FitRect;
    pageRect: FitRect;
  } | null>(null);

  const chapter = getFieldJournalChapter(chapterId) ?? STILLWATER_CHAPTER;
  const spreads = chapter.spreads;

  const windowEntries = useSpreadWindow(spreads, pageIndex);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  const goNext = useCallback(() => {
    setPageIndex((index) => {
      if (index >= spreads.length - 1) return index;
      onPageTurn();
      return index + 1;
    });
    onAnimatingChange(false);
  }, [onAnimatingChange, onPageTurn, spreads.length]);

  const goPrev = useCallback(() => {
    setPageIndex((index) => {
      if (index <= 0) return index;
      onPageTurn();
      return index - 1;
    });
    onAnimatingChange(false);
  }, [onAnimatingChange, onPageTurn]);

  const handleEdgeTap = useCallback(
    (direction: -1 | 1) => {
      if (isAnimating) return;
      if (direction === -1) {
        goPrev();
        return;
      }
      goNext();
    },
    [goNext, goPrev, isAnimating],
  );

  const handleChapterTab = useCallback(
    (nextChapterId: FieldJournalChapterTabId) => {
      if (nextChapterId === chapterId) return;

      const nextChapter = getFieldJournalChapter(nextChapterId);
      if (!nextChapter || nextChapter.spreads.length === 0) {
        Alert.alert("Coming soon", "This chapter is not ready yet.");
        return;
      }

      setChapterId(nextChapterId);
      setPageIndex(0);
    },
    [chapterId],
  );

  const handleClose = useCallback(() => {
    if (isAnimating) return;
    onClose();
  }, [isAnimating, onClose]);

  const handleCommitStart = useCallback(() => {
    onAnimatingChange(true);
  }, [onAnimatingChange]);

  const activeSpread = spreads[pageIndex];

  useEffect(() => {
    setLayoutRects(null);
  }, [activeSpread?.id]);

  const handleLayoutRectsChange = useCallback(
    (rects: { sceneRect: FitRect; pageRect: FitRect }) => {
      setLayoutRects(rects);
    },
    [],
  );

  const fallbackSceneRect = fitJournalSceneRect(width, height);
  const sceneLayoutRect = layoutRects?.sceneRect ?? fallbackSceneRect;
  const pageLayoutRect = layoutRects?.pageRect ?? journalBookPageFrameRect(fallbackSceneRect);

  if (!activeSpread) {
    return null;
  }

  return (
    <View style={[styles.root, { width, height }]}>
      <JournalViewer
        width={width}
        height={height}
        spreads={spreads}
        activeSpread={activeSpread}
        windowEntries={windowEntries}
        pageIndex={pageIndex}
        pageCount={spreads.length}
        reduceMotion={reduceMotion}
        disabled={isAnimating}
        onSwipeLeft={goNext}
        onSwipeRight={goPrev}
        onCommitStart={handleCommitStart}
        onLayoutRectsChange={handleLayoutRectsChange}
      />

      <Pressable
        style={[
          styles.edgeZone,
          styles.edgeAboveOverlay,
          {
            left: pageLayoutRect.x,
            top: pageLayoutRect.y,
            height: pageLayoutRect.height,
            width: Math.max(pageLayoutRect.width * 0.15, 48),
          },
        ]}
        disabled={isAnimating || pageIndex === 0}
        onPress={() => handleEdgeTap(-1)}
        accessibilityLabel="Previous page"
      />
      <Pressable
        style={[
          styles.edgeZone,
          styles.edgeAboveOverlay,
          {
            left: pageLayoutRect.x + pageLayoutRect.width * 0.72,
            top: pageLayoutRect.y,
            height: pageLayoutRect.height,
            width: Math.max(pageLayoutRect.width * 0.1, 48),
          },
        ]}
        disabled={isAnimating || pageIndex >= spreads.length - 1}
        onPress={() => handleEdgeTap(1)}
        accessibilityLabel="Next page"
      />

      {FIELD_JOURNAL_CHAPTER_TAB_IDS.map((tabId) => {
        const strip = chapterStripHitRect(tabId, FIELD_JOURNAL_REFERENCE_WIDTH);
        return (
          <Pressable
            key={tabId}
            accessibilityRole="button"
            accessibilityLabel={strip.label}
            accessibilityState={{ selected: chapterId === tabId }}
            disabled={isAnimating}
            onPress={() => handleChapterTab(tabId)}
            style={[styles.chapterStripHit, imageNormalizedToFrameStyle(strip, sceneLayoutRect)]}
          />
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close journal"
        disabled={isAnimating}
        onPress={handleClose}
        style={[styles.closeButton, { top: insets.top + 8 }]}
      >
        <Text style={styles.closeLabel}>Close</Text>
      </Pressable>

      <View style={styles.srOnly} accessibilityLabel={`${chapter.label} page ${pageIndex + 1}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#0D0A07",
    overflow: "hidden",
  },
  edgeZone: {
    position: "absolute",
    minWidth: 48,
  },
  edgeAboveOverlay: {
    zIndex: 10,
  },
  closeButton: {
    position: "absolute",
    left: 16,
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    paddingHorizontal: 8,
    zIndex: 10,
  },
  closeLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.primarySoft,
  },
  chapterStripHit: {
    minHeight: 48,
    zIndex: 10,
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
