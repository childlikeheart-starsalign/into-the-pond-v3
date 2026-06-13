import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { pondGlowOpacity } from "@/src/features/sanctuary/bloomCatalog";
import type {
  SanctuaryBloom,
  SanctuaryCultivation,
} from "@/src/features/sanctuary/cultivationTypes";
import { normalizeCultivation } from "@/src/features/sanctuary/cultivationTypes";
import { colors } from "@/src/constants/theme";

type SanctuaryCultivationLayerProps = {
  cultivation: SanctuaryCultivation;
  /** Bloom id to play a one-time arrival animation for. */
  arrivalBloomId?: string | null;
  onArrivalComplete?: (bloomId: string) => void;
};

function BloomMarker({
  bloom,
  arriving,
  onArrivalComplete,
}: {
  bloom: SanctuaryBloom;
  arriving: boolean;
  onArrivalComplete?: () => void;
}) {
  const scale = useSharedValue(arriving ? 0.2 : 1);
  const opacity = useSharedValue(arriving ? 0 : 1);

  useEffect(() => {
    if (!arriving) return;
    scale.value = withSequence(
      withTiming(1.15, { duration: 700, easing: Easing.out(Easing.back(1.4)) }),
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withTiming(1, { duration: 500 }, (finished) => {
      if (finished && onArrivalComplete) {
        runOnJS(onArrivalComplete)();
      }
    });
  }, [arriving, onArrivalComplete, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.bloomAnchor,
        { left: `${bloom.x * 100}%`, top: `${bloom.y * 100}%` },
        animatedStyle,
      ]}
      accessibilityLabel={`Sanctuary ${bloom.kind}`}
      pointerEvents="none"
    >
      {bloom.kind === "flower" ? <FlowerBloom /> : null}
      {bloom.kind === "lantern" ? <LanternBloom /> : null}
      {bloom.kind === "firefly" ? <FireflyBloom /> : null}
    </Animated.View>
  );
}

function FlowerBloom() {
  return (
    <View style={styles.flower}>
      <View style={[styles.petal, styles.petalTop]} />
      <View style={[styles.petal, styles.petalLeft]} />
      <View style={[styles.petal, styles.petalRight]} />
      <View style={styles.flowerCenter} />
    </View>
  );
}

function LanternBloom() {
  return (
    <View style={styles.lantern}>
      <View style={styles.lanternGlow} />
      <View style={styles.lanternCore} />
    </View>
  );
}

function FireflyBloom() {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.85 + pulse.value * 0.25 }],
  }));

  return (
    <Animated.View style={[styles.firefly, glowStyle]}>
      <View style={styles.fireflyCore} />
    </Animated.View>
  );
}

function PondGlow({ reflectionCount, arriving }: { reflectionCount: number; arriving: boolean }) {
  const opacity = useSharedValue(
    pondGlowOpacity(Math.max(0, reflectionCount - (arriving ? 1 : 0))),
  );
  const ripple = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(pondGlowOpacity(reflectionCount), {
      duration: arriving ? 1200 : 400,
      easing: Easing.out(Easing.cubic),
    });
    if (!arriving) return;
    ripple.value = withSequence(
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 0 }),
    );
  }, [arriving, opacity, reflectionCount, ripple]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: (1 - ripple.value) * 0.5,
    transform: [{ scale: 0.7 + ripple.value * 0.8 }],
  }));

  return (
    <View style={styles.pondArea} pointerEvents="none">
      <Animated.View style={[styles.pondRipple, rippleStyle]} />
      <Animated.View style={[styles.pondGlow, glowStyle]} />
    </View>
  );
}

export function SanctuaryCultivationLayer({
  cultivation: cultivationInput,
  arrivalBloomId,
  onArrivalComplete,
}: SanctuaryCultivationLayerProps) {
  const cultivation = normalizeCultivation(cultivationInput);
  const hasCultivation = cultivation.reflectionCount > 0 || cultivation.blooms.length > 0;
  if (!hasCultivation && !arrivalBloomId) return null;

  return (
    <View style={styles.layer} pointerEvents="none">
      <PondGlow reflectionCount={cultivation.reflectionCount} arriving={Boolean(arrivalBloomId)} />
      {cultivation.blooms.map((bloom) => (
        <BloomMarker
          key={bloom.id}
          bloom={bloom}
          arriving={bloom.id === arrivalBloomId}
          onArrivalComplete={
            bloom.id === arrivalBloomId ? () => onArrivalComplete?.(bloom.id) : undefined
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  bloomAnchor: {
    position: "absolute",
    marginLeft: -18,
    marginTop: -18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  flower: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  petal: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(111, 125, 104, 0.75)",
  },
  petalTop: {
    top: 0,
  },
  petalLeft: {
    left: 2,
    bottom: 4,
    backgroundColor: "rgba(122, 92, 69, 0.55)",
  },
  petalRight: {
    right: 2,
    bottom: 4,
    backgroundColor: "rgba(122, 92, 69, 0.55)",
  },
  flowerCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primarySoft,
  },
  lantern: {
    width: 22,
    height: 28,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  lanternGlow: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(239, 228, 218, 0.45)",
  },
  lanternCore: {
    width: 16,
    height: 20,
    borderRadius: 8,
    backgroundColor: "rgba(154, 122, 66, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(239, 228, 218, 0.8)",
  },
  firefly: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fireflyCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(222, 234, 242, 0.95)",
    shadowColor: "#DEEAF2",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  pondArea: {
    position: "absolute",
    left: "34%",
    bottom: "18%",
    width: "32%",
    height: "14%",
    alignItems: "center",
    justifyContent: "center",
  },
  pondGlow: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  pondRipple: {
    position: "absolute",
    width: "90%",
    height: "90%",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(122, 92, 69, 0.25)",
  },
});
