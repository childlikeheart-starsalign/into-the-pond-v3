import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import {
  formatTuningForLayoutTs,
  type SanctuaryHeaderSlotKey,
  type SanctuaryHeaderTuningTarget,
} from "@/src/features/sanctuary/sanctuaryHeaderTuning";
import { useSanctuaryHeaderTuning } from "@/src/features/sanctuary/sanctuaryHeaderTuningContext";

type DevStepperProps = {
  label: string;
  value: number;
  step: number;
  decimals?: number;
  onDecrement: () => void;
  onIncrement: () => void;
};

function DevStepper({
  label,
  value,
  step,
  decimals = 0,
  onDecrement,
  onIncrement,
}: DevStepperProps) {
  const display = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));

  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          style={styles.stepperButton}
          onPress={onDecrement}
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{display}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          style={styles.stepperButton}
          onPress={onIncrement}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
        <Text style={styles.stepperStep}>±{step}</Text>
      </View>
    </View>
  );
}

const TARGETS: { id: SanctuaryHeaderTuningTarget; label: string }[] = [
  { id: "overlay", label: "Overlay" },
  { id: "month", label: "Month" },
  { id: "wonderBottle", label: "Bottle" },
  { id: "wonderCount", label: "Wonder #" },
  { id: "childName", label: "Name" },
  { id: "settings", label: "Settings" },
  { id: "avatar", label: "Avatar" },
];

const SLOT_KEYS = new Set<SanctuaryHeaderTuningTarget>([
  "month",
  "wonderBottle",
  "wonderCount",
  "childName",
  "settings",
  "avatar",
]);

export function SanctuaryHeaderDevPanel() {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["55%", "88%"], []);
  const {
    state,
    refWidth,
    panelOpen,
    activeTarget,
    setPanelOpen,
    setActiveTarget,
    setBandHeight,
    setAvatarCenterY,
    nudgeSlot,
    reset,
  } = useSanctuaryHeaderTuning();

  const copySnippet = useMemo(() => formatTuningForLayoutTs(state), [state]);

  useEffect(() => {
    if (panelOpen) {
      sheetRef.current?.snapToIndex(0);
      return;
    }
    sheetRef.current?.close();
  }, [panelOpen]);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
  }, [setPanelOpen]);

  const handleCopy = useCallback(() => {
    console.log("[SanctuaryHeaderDevPanel]\n" + copySnippet);
    void Share.share({ message: copySnippet });
  }, [copySnippet]);

  if (!__DEV__ || !panelOpen) return null;

  const activeSlot = SLOT_KEYS.has(activeTarget) ? (activeTarget as SanctuaryHeaderSlotKey) : null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.35}
          pressBehavior="close"
        />
      )}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
      style={styles.sheet}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Header layout tuning</Text>
        <Text style={styles.hint}>
          Frame width {refWidth}pt. Triple-tap child name to close. Slot offsets nudge
          HEADER_OPTICAL_OFFSETS.
        </Text>

        <Text style={styles.sectionTitle}>Target</Text>
        <View style={styles.targetRow}>
          {TARGETS.map((target) => {
            const selected = activeTarget === target.id;
            return (
              <Pressable
                key={target.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.targetChip, selected && styles.targetChipSelected]}
                onPress={() => setActiveTarget(target.id)}
              >
                <Text style={[styles.targetChipText, selected && styles.targetChipTextSelected]}>
                  {target.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTarget === "overlay" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overlay</Text>
            <Text style={styles.hint}>
              Composite overlay uses fixed normalized rect: left −4.6%, top −21%, width 108%, height
              159% of the header band. Adjust band height below if needed.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Band</Text>
          <DevStepper
            label="Band height"
            value={state.bandHeight}
            step={1}
            onDecrement={() => setBandHeight(state.bandHeight - 1)}
            onIncrement={() => setBandHeight(state.bandHeight + 1)}
          />
          <DevStepper
            label="Avatar center Y"
            value={state.avatarCenterY}
            step={0.01}
            decimals={2}
            onDecrement={() => setAvatarCenterY(state.avatarCenterY - 0.01)}
            onIncrement={() => setAvatarCenterY(state.avatarCenterY + 0.01)}
          />
        </View>

        {activeSlot ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Slot offset — {activeSlot}</Text>
            <DevStepper
              label="X"
              value={state.slotOffsets[activeSlot].x}
              step={1}
              onDecrement={() => nudgeSlot(activeSlot, "x", -1)}
              onIncrement={() => nudgeSlot(activeSlot, "x", 1)}
            />
            <DevStepper
              label="Y"
              value={state.slotOffsets[activeSlot].y}
              step={1}
              onDecrement={() => nudgeSlot(activeSlot, "y", -1)}
              onIncrement={() => nudgeSlot(activeSlot, "y", 1)}
            />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy layout constants"
            style={styles.actionButton}
            onPress={handleCopy}
          >
            <Text style={styles.actionButtonText}>Copy constants</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset header tuning"
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={reset}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Reset</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Paste preview</Text>
        <Text style={styles.snippet} selectable>
          {copySnippet}
        </Text>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    zIndex: 100,
  },
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    backgroundColor: colors.border,
  },
  content: {
    paddingHorizontal: spacing.inner,
    paddingBottom: spacing.section * 2,
    gap: spacing.inner,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 22,
    letterSpacing: -0.02 * 22,
    color: colors.textPrimary,
  },
  hint: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    gap: spacing.inner,
    marginTop: spacing.inner,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: spacing.inner,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.inner,
  },
  stepperLabel: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.tapGap,
  },
  stepperButton: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 22,
    color: colors.primary,
    lineHeight: 24,
  },
  stepperValue: {
    minWidth: 56,
    textAlign: "center",
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.textPrimary,
  },
  stepperStep: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 36,
  },
  targetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.tapGap,
  },
  targetChip: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  targetChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  targetChipText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  targetChipTextSelected: {
    fontFamily: fontFamilies.bodySemi,
    color: colors.primary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.inner,
    marginTop: spacing.section,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  actionButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.surface,
  },
  actionButtonTextSecondary: {
    color: colors.textPrimary,
  },
  snippet: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.cardPadding,
  },
});
