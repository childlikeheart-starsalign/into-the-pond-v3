import { StyleSheet, Text, View } from "react-native";

import type { FishingRodId } from "@/shared/sanctuary/types";
import { colors, fontFamilies } from "@/src/constants/theme";
import {
  CRAFT_BENCH_RARE_LAYOUT,
  memoChildStyle,
} from "@/src/features/craftBench/craftBenchLayout";

const ELEMENT_TITLE_COLOR: Partial<Record<FishingRodId, string>> = {
  rare_fire: "#8B4A3A",
  rare_water: "#4A6B7A",
  rare_wind: "#6F7D68",
  rare_electric: "#7A6B4A",
};

type CraftBenchMemoProps = {
  memoRect: { left: number; top: number; width: number; height: number };
  rodId: FishingRodId;
  rodName: string;
  statusLine: string;
  uxLabel: string;
  wonderCurrent: number;
  wonderRequired: number;
  partsCurrent: number;
  partsRequired: number;
  lastError: string | null;
};

export function CraftBenchMemo({
  memoRect,
  rodId,
  rodName,
  statusLine,
  uxLabel,
  wonderCurrent,
  wonderRequired,
  partsCurrent,
  partsRequired,
  lastError,
}: CraftBenchMemoProps) {
  const { memo } = CRAFT_BENCH_RARE_LAYOUT;
  const titleColor = ELEMENT_TITLE_COLOR[rodId] ?? colors.primary;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.memoRoot,
        {
          left: memoRect.left,
          top: memoRect.top,
          width: memoRect.width,
          height: memoRect.height,
        },
      ]}
    >
      <View style={[memoChildStyle(memo.title), styles.shiftDown50]}>
        <Text style={[styles.title, { color: titleColor }]}>{rodName}</Text>
      </View>

      <View style={[memoChildStyle(memo.status), styles.shiftDown50]}>
        <Text style={styles.status}>{statusLine}</Text>
      </View>

      <View style={[styles.resourceCol, memoChildStyle(memo.wonderColumn), styles.shiftDown50]}>
        <Text style={styles.resourceLabel}>Wonder</Text>
        <Text style={styles.resourceValue}>
          {wonderCurrent} / {wonderRequired}
        </Text>
      </View>

      <View style={[styles.resourceCol, memoChildStyle(memo.partsColumn), styles.shiftDown50]}>
        <Text style={styles.resourceLabel}>Parts</Text>
        <Text style={styles.resourceValue}>
          {partsCurrent} / {partsRequired}
        </Text>
      </View>

      <View style={[memoChildStyle(memo.footer), styles.footerWrap]}>
        <Text style={styles.footer}>{uxLabel}</Text>
        {lastError ? <Text style={styles.error}>{lastError}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  memoRoot: {
    position: "absolute",
    overflow: "visible",
  },
  shiftDown50: {
    transform: [{ translateY: 50 }],
  },
  footerWrap: {
    justifyContent: "flex-start",
    transform: [{ translateY: -7 }],
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  status: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    color: "#2C1810",
    textAlign: "center",
  },
  resourceCol: {
    justifyContent: "center",
    alignItems: "center",
  },
  resourceLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 2,
  },
  resourceValue: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: colors.textPrimary,
    textAlign: "center",
  },
  footer: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 8,
    lineHeight: 14,
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
});
