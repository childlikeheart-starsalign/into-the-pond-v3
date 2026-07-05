import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";

import { colors } from "@/src/constants/theme";
import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { SANCTUARY_STAGE_MODE, usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { WellTopBar } from "@/src/features/well/WellTopBar";
import { normRectToStyle, WELL_LAYOUT } from "@/src/features/well/wellModalLayout";
import { WellSceneJourney, type WellVisualPhase } from "@/src/features/well/WellSceneJourney";

type WellSceneBackgroundProps = PropsWithChildren<{
  phase: WellVisualPhase;
  onPhaseChange: (phase: WellVisualPhase) => void;
  onCloseupReady: () => void;
  onClose: () => void;
  showOverlay: boolean;
}>;

export function WellSceneBackground({
  phase,
  onPhaseChange,
  onCloseupReady,
  onClose,
  showOverlay,
  children,
}: WellSceneBackgroundProps) {
  const frame = usePortrait916Layout(SANCTUARY_STAGE_MODE);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const closeupReadySent = useRef(false);

  const stageWidth = stageSize.width > 0 ? stageSize.width : frame.width;
  const stageHeight = stageSize.height > 0 ? stageSize.height : frame.height;

  const handleStageLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setStageSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  useEffect(() => {
    if (phase !== "interactive" || closeupReadySent.current) return;
    closeupReadySent.current = true;
    onCloseupReady();
  }, [onCloseupReady, phase]);

  const overlayStyle =
    stageWidth > 0 && stageHeight > 0
      ? normRectToStyle(WELL_LAYOUT.focusFlipCard, stageWidth, stageHeight)
      : styles.cardOverlayFallback;

  return (
    <Portrait916Frame mode={SANCTUARY_STAGE_MODE} backgroundColor={colors.bg}>
      <View style={styles.stageRoot} onLayout={handleStageLayout}>
        {stageWidth > 0 && stageHeight > 0 ? (
          <WellSceneJourney
            phase={phase}
            onPhaseChange={onPhaseChange}
            onCloseupReady={() => {
              if (closeupReadySent.current) return;
              closeupReadySent.current = true;
              onCloseupReady();
            }}
            frameWidth={stageWidth}
            frameHeight={stageHeight}
          />
        ) : null}

        <View style={styles.topBarWrap} pointerEvents="box-none">
          <WellTopBar onClose={onClose} />
        </View>

        {showOverlay ? (
          <View pointerEvents="box-none" style={[styles.cardOverlay, overlayStyle]}>
            {children}
          </View>
        ) : null}
      </View>
    </Portrait916Frame>
  );
}

const styles = StyleSheet.create({
  stageRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  topBarWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cardOverlay: {
    zIndex: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  cardOverlayFallback: {
    position: "absolute",
    left: "8%",
    top: "34%",
    width: "84%",
    height: "46%",
    zIndex: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});
