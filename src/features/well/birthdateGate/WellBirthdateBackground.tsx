import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { SANCTUARY_STAGE_MODE } from "@/src/hooks/usePortrait916Layout";
import { BotanicalEdgeOverlay } from "@/src/features/well/birthdateGate/BotanicalEdgeOverlay";
import { GhostedWellBackground } from "@/src/features/well/birthdateGate/GhostedWellBackground";
import { pondColor } from "@/src/features/well/birthdateGate/wellBirthdateTokens";

type WellBirthdateBackgroundProps = {
  children: React.ReactNode;
};

/** Same centered 9:16 stage as sanctuary — background cover, UI overlaid in-frame. */
export function WellBirthdateBackground({ children }: WellBirthdateBackgroundProps) {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setStageSize({ width, height });
  };

  return (
    <Portrait916Frame mode={SANCTUARY_STAGE_MODE} backgroundColor={pondColor.cream}>
      <View style={styles.root} onLayout={handleLayout}>
        <GhostedWellBackground stageWidth={stageSize.width} stageHeight={stageSize.height} />
        <BotanicalEdgeOverlay />
        {children}
      </View>
    </Portrait916Frame>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
