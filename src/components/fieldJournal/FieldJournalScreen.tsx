import { useCallback, useEffect, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";

import { FieldJournalCover } from "@/src/components/fieldJournal/FieldJournalCover";
import { FieldJournalReader } from "@/src/components/fieldJournal/FieldJournalReader";
import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { colors } from "@/src/constants/theme";
import { clearSpreadImageCache } from "@/src/features/fieldJournal/spreadImageCache";
import { releaseAllForScope } from "@/src/features/journal/useSharedSkiaImage";
import { useFieldJournalSounds } from "@/src/features/fieldJournal/useFieldJournalSounds";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { closeSceneScreen } from "@/src/navigation/closeSceneScreen";
import { setFieldJournalView } from "@/src/state/fieldJournalView";

type JournalPhase = "cover" | "reader";

export function FieldJournalScreen() {
  const [phase, setPhase] = useState<JournalPhase>("cover");
  const [isAnimating, setIsAnimating] = useState(false);
  const { width: frameWidth, height: frameHeight } = usePortrait916Layout("contain");
  const sounds = useFieldJournalSounds();

  useEffect(() => {
    setFieldJournalView(phase);
    return () => {
      setFieldJournalView("cover");
      releaseAllForScope("journal:");
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "cover") {
      releaseAllForScope("journal:");
    }
  }, [phase]);

  const handleOpenStart = useCallback(() => {
    setIsAnimating(true);
    void sounds.playBookOpen();
  }, [sounds]);

  const handleOpenComplete = useCallback(() => {
    setIsAnimating(false);
    setPhase("reader");
    void sounds.startAmbient();
  }, [sounds]);

  const handleCloseReader = useCallback(() => {
    setIsAnimating(true);
    void sounds.stopAmbient();
    setPhase("cover");
    setIsAnimating(false);
  }, [sounds]);

  const handleCloseCover = useCallback(() => {
    void sounds.stopAll();
    releaseAllForScope("journal:");
    clearSpreadImageCache();
    closeSceneScreen("journal_cover");
  }, [sounds]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Portrait916Frame mode="contain" backgroundColor={colors.bg}>
        {phase === "cover" ? (
          <FieldJournalCover
            isAnimating={isAnimating}
            onOpenStart={handleOpenStart}
            onOpenComplete={handleOpenComplete}
            onClose={handleCloseCover}
          />
        ) : frameWidth > 0 && frameHeight > 0 ? (
          <FieldJournalReader
            width={frameWidth}
            height={frameHeight}
            isAnimating={isAnimating}
            onAnimatingChange={setIsAnimating}
            onPageTurn={() => {
              void sounds.playPageTurn();
            }}
            onClose={handleCloseReader}
          />
        ) : null}
      </Portrait916Frame>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
