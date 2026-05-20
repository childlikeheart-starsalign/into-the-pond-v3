import { useCallback } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { runOnJS } from "react-native-reanimated";

import { colors, spacing } from "@/src/constants/theme";

const MODULE_COUNT = 5;
const DIAL_WIDTH = 280;
const CX = DIAL_WIDTH / 2;
const R_OUTER = 115;
const CY = 128;
const NEEDLE_LEN = 88;
const TICK_INNER = R_OUTER - 18;
const TICK_OUTER = R_OUTER - 4;

/** Needle angle (rad): π → module 1 (left), 0 → module 5 (right) along upper arc */
export function moduleToAngleRad(module: number): number {
  const idx = Math.max(0, Math.min(MODULE_COUNT - 1, module - 1));
  return Math.PI - (idx / (MODULE_COUNT - 1)) * Math.PI;
}

function touchToModule(dx: number, dy: number): number {
  let a = Math.atan2(dy, dx);
  if (a < 0) a += 2 * Math.PI;
  if (a > Math.PI) {
    if (a >= 1.5 * Math.PI) a = 0;
    else a = Math.PI;
  }
  const t = (Math.PI - a) / Math.PI;
  const idx = Math.round(t * (MODULE_COUNT - 1));
  return 1 + Math.max(0, Math.min(MODULE_COUNT - 1, idx));
}

function tickAngles(): number[] {
  const out: number[] = [];
  for (let i = 0; i < MODULE_COUNT; i += 1) {
    out.push(Math.PI - (i / (MODULE_COUNT - 1)) * Math.PI);
  }
  return out;
}

type ModuleDialProps = {
  selectedModule: number;
  onModuleChange: (module: number) => void;
};

export function ModuleDial({ selectedModule, onModuleChange }: ModuleDialProps) {
  const angles = tickAngles();
  const needleAngle = moduleToAngleRad(selectedModule);
  const nx = CX + NEEDLE_LEN * Math.cos(needleAngle);
  const ny = CY + NEEDLE_LEN * Math.sin(needleAngle);

  const emitModule = useCallback(
    (m: number) => {
      onModuleChange(Math.max(1, Math.min(MODULE_COUNT, m)));
    },
    [onModuleChange],
  );

  const pan = Gesture.Pan().onEnd((e) => {
    const dx = e.x - CX;
    const dy = e.y - CY;
    const m = touchToModule(dx, dy);
    runOnJS(emitModule)(m);
  });

  /** Upper semicircle: bulge toward smaller y (sweep 0) */
  const arcPath = `M ${CX - R_OUTER} ${CY} A ${R_OUTER} ${R_OUTER} 0 0 0 ${CX + R_OUTER} ${CY}`;

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={pan}>
        <View style={styles.dialHit} collapsable={false}>
          <View style={styles.svgFrame}>
            <Svg width={DIAL_WIDTH} height={160} accessibilityLabel="Module dial">
              <Path d={arcPath} stroke={colors.border} strokeWidth={3} fill="none" />
              {angles.map((ang, i) => {
                const x1 = CX + TICK_INNER * Math.cos(ang);
                const y1 = CY + TICK_INNER * Math.sin(ang);
                const x2 = CX + TICK_OUTER * Math.cos(ang);
                const y2 = CY + TICK_OUTER * Math.sin(ang);
                return (
                  <Line
                    key={`tick-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={colors.primary}
                    strokeWidth={2}
                  />
                );
              })}
              <Circle cx={CX} cy={CY} r={10} fill={colors.primary} />
              <Line
                x1={CX}
                y1={CY}
                x2={nx}
                y2={ny}
                stroke={colors.primaryHover}
                strokeWidth={4}
                strokeLinecap="round"
              />
            </Svg>
            {angles.map((ang, i) => {
              const labelR = R_OUTER + 18;
              const lx = CX + labelR * Math.cos(ang);
              const ly = CY + labelR * Math.sin(ang);
              return (
                <Text
                  key={`lbl-${i}`}
                  style={[styles.tickLabel, { left: lx - 8, top: ly - 10 }]}
                  pointerEvents="none"
                >
                  {String(i + 1)}
                </Text>
              );
            })}
          </View>
        </View>
      </GestureDetector>

      <View style={styles.a11yRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous module"
          style={[styles.a11yBtn, selectedModule <= 1 && styles.a11yBtnDisabled]}
          disabled={selectedModule <= 1}
          onPress={() => emitModule(selectedModule - 1)}
        >
          <Text style={styles.a11yBtnText}>Previous module</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next module"
          style={[styles.a11yBtn, selectedModule >= MODULE_COUNT && styles.a11yBtnDisabled]}
          disabled={selectedModule >= MODULE_COUNT}
          onPress={() => emitModule(selectedModule + 1)}
        >
          <Text style={styles.a11yBtnText}>Next module</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.inner,
    paddingBottom: spacing.inner,
  },
  dialHit: {
    width: DIAL_WIDTH,
    minHeight: 160,
  },
  svgFrame: {
    width: DIAL_WIDTH,
    height: 160,
    position: "relative",
  },
  tickLabel: {
    position: "absolute",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.textSecondary,
    width: 20,
    textAlign: "center",
  },
  a11yRow: {
    flexDirection: "row",
    gap: spacing.tapGap,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  a11yBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  a11yBtnDisabled: {
    opacity: 0.45,
  },
  a11yBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: colors.textPrimary,
  },
});
