import { BlurMask, Circle, Group, Paint } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";

import type { BreathingHotspot } from "@/src/features/fieldJournal/types";

type BreathingGlowOverlayProps = {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
  hotspots: BreathingHotspot[];
  active: boolean;
};

export function BreathingGlowOverlay({
  width,
  height,
  offsetX = 0,
  offsetY = 0,
  hotspots,
  active,
}: BreathingGlowOverlayProps) {
  if (!active) return null;

  return (
    <Group transform={[{ translateX: offsetX }, { translateY: offsetY }]}>
      {hotspots.map((spot, index) => (
        <BreathingSpot
          key={`${spot.x}-${spot.y}-${index}`}
          spot={spot}
          width={width}
          height={height}
          phaseOffset={index * 1.1}
        />
      ))}
    </Group>
  );
}

type BreathingSpotProps = {
  spot: BreathingHotspot;
  width: number;
  height: number;
  phaseOffset: number;
};

function BreathingSpot({ spot, width, height, phaseOffset }: BreathingSpotProps) {
  const cx = spot.x * width;
  const cy = spot.y * height;
  const baseRadius = Math.max(spot.rx * width, spot.ry * height);
  const radius = useSharedValue(baseRadius);
  const opacity = useSharedValue(0.22);

  useFrameCallback((frame) => {
    const t = frame.timestamp / 1000 + phaseOffset;
    const wave = Math.sin(t * 1.6);
    radius.value = baseRadius * (0.94 + 0.06 * wave);
    opacity.value = 0.05 + 0.04 * ((wave + 1) / 2);
  });

  useEffect(() => {
    radius.value = baseRadius;
    opacity.value = 0.06;
  }, [baseRadius, opacity, radius]);

  return (
    <Circle cx={cx} cy={cy} r={radius} color={spot.color} opacity={opacity}>
      <Paint>
        <BlurMask blur={18} style="normal" />
      </Paint>
    </Circle>
  );
}
