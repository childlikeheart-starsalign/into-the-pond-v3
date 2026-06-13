import { router } from "expo-router";
import { useCallback, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";

import { FieldJournalCover } from "@/src/components/fieldJournal/FieldJournalCover";
import { FieldJournalReader } from "@/src/components/fieldJournal/FieldJournalReader";
import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { colors } from "@/src/constants/theme";
import { clearSpreadImageCache } from "@/src/features/fieldJournal/spreadImageCache";
import { useFieldJournalSounds } from "@/src/features/fieldJournal/useFieldJournalSounds";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { routes } from "@/src/navigation/routes";

type JournalPhase = "cover" | "reader";

export function FieldJournalScreen() {
  const [phase, setPhase] = useState<JournalPhase>("cover");
  const [isAnimating, setIsAnimating] = useState(false);
  const { width: frameWidth, height: frameHeight } = usePortrait916Layout("contain");
  const sounds = useFieldJournalSounds();

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

  const handleBackToSanctuary = useCallback(() => {
    void sounds.stopAll();
    clearSpreadImageCache();
    router.replace(routes.sanctuary);
  }, [sounds]);

  const hasFrame = frameWidth > 0 && frameHeight > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Portrait916Frame>
        {hasFrame ? (
          phase === "cover" ? (
            <FieldJournalCover
              width={frameWidth}
              height={frameHeight}
              isAnimating={isAnimating}
              onOpenStart={handleOpenStart}
              onOpenComplete={handleOpenComplete}
              onBackToSanctuary={handleBackToSanctuary}
            />
          ) : (
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
          )
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
