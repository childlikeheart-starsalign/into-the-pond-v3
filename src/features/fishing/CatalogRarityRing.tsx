import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus, Pressable, StyleSheet, View } from "react-native";
import {
  Easing,
  runOnJS,
  type SharedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import {
  isBandUnlocked,
  pondRippleCalmBeatDelayMs,
  POND_RIPPLE_BAND_ORDER,
  POND_RIPPLE_SEQUENCE_BAND_MS,
  POND_RIPPLE_SEQUENCE_PRE_BEAT_MS,
  POND_RIPPLE_SEQUENCE_RECOGNITION_MS,
  POND_RIPPLE_STROKE_WIDTHS,
  type PondRippleActiveTier,
  type PondRippleDisplayTier,
} from "@/src/features/fishing/pondRippleCatalog";
import {
  POND_PLATE_RADII,
  POND_PLATE_SIZE,
  WatercolorPondPlate,
} from "@/src/features/fishing/WatercolorPondPlate";

const HIT_Z: Record<PondRippleDisplayTier, number> = {
  epic: 0,
  rare: 1,
  common: 2,
  empty: 3,
};

export type CatalogRarityRingProps = {
  caughtTier: PondRippleDisplayTier;
  /** Snapshotted at claim resolution — never live-subscribe inside this component. */
  subscriptionTier: PondRippleActiveTier;
  /** De-dupe key; caller should skip mounting when already animated. */
  claimedCreatureId: string;
  onComplete: () => void;
};

function useBandSettles(): Record<PondRippleDisplayTier, SharedValue<number>> {
  const empty = useSharedValue(0);
  const common = useSharedValue(0);
  const rare = useSharedValue(0);
  const epic = useSharedValue(0);
  return useMemo(
    () => ({
      empty,
      common,
      rare,
      epic,
    }),
    [common, empty, epic, rare],
  );
}

/**
 * Pond Ripple — sequential outer→inner illuminate, then recognition rest on matched band.
 * Pure display; stroke thickness ∝ static empty + catalog ratios.
 */
export function CatalogRarityRing({
  caughtTier,
  subscriptionTier,
  claimedCreatureId,
  onComplete,
}: CatalogRarityRingProps) {
  const flourish = useSharedValue(0);
  const recognitionWarmth = useSharedValue(0);
  const calmBeat = useSharedValue(0);
  const ackPulse = useSharedValue(0);
  const bandSettles = useBandSettles();
  const [ackBand, setAckBand] = useState<PondRippleDisplayTier | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  const snapToFinal = useCallback(() => {
    flourish.value = 1;
    for (const band of POND_RIPPLE_BAND_ORDER) {
      bandSettles[band].value = 1;
    }
    recognitionWarmth.value = 1;
    calmBeat.value = 1;
    finish();
  }, [bandSettles, calmBeat, finish, flourish, recognitionWarmth]);

  useEffect(() => {
    completedRef.current = false;
    flourish.value = 0;
    recognitionWarmth.value = 0;
    calmBeat.value = 0;
    ackPulse.value = 0;
    setAckBand(null);
    for (const band of POND_RIPPLE_BAND_ORDER) {
      bandSettles[band].value = 0;
    }

    flourish.value = withTiming(1, {
      duration: POND_RIPPLE_SEQUENCE_PRE_BEAT_MS,
      easing: Easing.inOut(Easing.cubic),
    });

    for (let index = 0; index < POND_RIPPLE_BAND_ORDER.length; index += 1) {
      const band = POND_RIPPLE_BAND_ORDER[index]!;
      const delay = POND_RIPPLE_SEQUENCE_PRE_BEAT_MS + index * POND_RIPPLE_SEQUENCE_BAND_MS;
      bandSettles[band].value = withDelay(
        delay,
        withTiming(1, {
          duration: POND_RIPPLE_SEQUENCE_BAND_MS,
          easing: Easing.inOut(Easing.cubic),
        }),
      );
    }

    const recognitionStart = pondRippleCalmBeatDelayMs();
    const recognitionEase = Easing.inOut(Easing.cubic);

    calmBeat.value = withDelay(
      recognitionStart,
      withTiming(1, {
        duration: POND_RIPPLE_SEQUENCE_RECOGNITION_MS,
        easing: recognitionEase,
      }),
    );

    recognitionWarmth.value = withDelay(
      recognitionStart,
      withTiming(
        1,
        {
          duration: POND_RIPPLE_SEQUENCE_RECOGNITION_MS,
          easing: recognitionEase,
        },
        (finished) => {
          if (finished) runOnJS(finish)();
        },
      ),
    );
  }, [ackPulse, bandSettles, claimedCreatureId, finish, flourish, calmBeat, recognitionWarmth]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === "background" || state === "inactive") {
        snapToFinal();
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [snapToFinal]);

  const playLockedAck = useCallback(
    (band: PondRippleDisplayTier) => {
      if (isBandUnlocked(band, subscriptionTier)) return;
      setAckBand(band);
      ackPulse.value = 0;
      ackPulse.value = withSequence(
        withTiming(1, { duration: 180, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 220, easing: Easing.inOut(Easing.quad) }),
      );
    },
    [ackPulse, subscriptionTier],
  );

  const lockedBands = useMemo(
    () => POND_RIPPLE_BAND_ORDER.filter((band) => !isBandUnlocked(band, subscriptionTier)),
    [subscriptionTier],
  );

  return (
    <View
      style={styles.wrap}
      accessibilityLabel="Pond rarity rings"
      accessibilityHint="A painted pond plate showing empty water and the pond catalog"
      testID={`catalog-rarity-ring-${claimedCreatureId}`}
    >
      <WatercolorPondPlate
        caughtTier={caughtTier}
        activeTier={subscriptionTier}
        flourish={flourish}
        recognitionWarmth={recognitionWarmth}
        calmBeat={calmBeat}
        ackPulse={ackPulse}
        ackBand={ackBand}
        bandSettles={bandSettles}
      />
      {/* Locked creature-band hit targets — pulse ack only, no nav/copy. */}
      {lockedBands.map((band) => {
        const r = POND_PLATE_RADII[band];
        const stroke = POND_RIPPLE_STROKE_WIDTHS[band];
        const hit = stroke + 16;
        const diameter = (r + hit / 2) * 2;
        return (
          <Pressable
            key={`hit-${band}`}
            accessibilityRole="button"
            accessibilityLabel={`Locked ${band} band`}
            onPress={() => playLockedAck(band)}
            style={[
              styles.bandHit,
              {
                width: diameter,
                height: diameter,
                borderRadius: diameter / 2,
                left: (POND_PLATE_SIZE - diameter) / 2,
                top: (POND_PLATE_SIZE - diameter) / 2,
                zIndex: HIT_Z[band],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: POND_PLATE_SIZE,
    marginVertical: 8,
    width: POND_PLATE_SIZE,
    alignSelf: "center",
  },
  bandHit: {
    position: "absolute",
  },
});
