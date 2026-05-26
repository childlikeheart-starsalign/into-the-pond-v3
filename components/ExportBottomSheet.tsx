import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { DiaryStoryCapture, type DiaryStoryCaptureHandle } from "@/components/DiaryStoryCapture";
import { colors, fontFamilies, layout, spacing } from "@/src/constants/theme";
import {
  isViewShotNativeAvailable,
  shareEntryText,
  sharePdfOrText,
  shareToFacebookStory,
  shareToInstagramStory,
  type ExportEntryData,
} from "@/utils/exportHelpers";

type ExportTarget = "whatsapp" | "instagram" | "facebook" | "more";

type ExportBottomSheetProps = {
  visible: boolean;
  entryData: ExportEntryData | null;
  onClose: () => void;
  onNotNow: () => void;
};

export function ExportBottomSheet({
  visible,
  entryData,
  onClose,
  onNotNow,
}: ExportBottomSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const storyCaptureRef = useRef<DiaryStoryCaptureHandle>(null);
  const snapPoints = useMemo(() => ["38%"], []);
  const [busyTarget, setBusyTarget] = useState<ExportTarget | null>(null);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
      return;
    }
    sheetRef.current?.close();
  }, [visible]);

  const handleShare = useCallback(
    async (target: ExportTarget) => {
      if (!entryData || busyTarget) return;

      setBusyTarget(target);

      try {
        if (target === "instagram" || target === "facebook") {
          let imageUri: string | null = null;

          if (isViewShotNativeAvailable()) {
            try {
              imageUri = (await storyCaptureRef.current?.capture()) ?? null;
            } catch (captureError) {
              console.warn("[ExportBottomSheet] story capture failed", captureError);
            }
          }

          if (target === "instagram") {
            await shareToInstagramStory(imageUri, entryData);
          } else {
            await shareToFacebookStory(imageUri, entryData);
          }
        } else if (target === "whatsapp") {
          await shareEntryText(entryData);
        } else {
          await sharePdfOrText(entryData);
        }

        onClose();
      } catch (shareError) {
        console.warn("[ExportBottomSheet] share failed, falling back to text", shareError);
        try {
          await shareEntryText(entryData);
          onClose();
        } catch (fallbackError) {
          console.warn("[ExportBottomSheet] text fallback failed", fallbackError);
        }
      } finally {
        setBusyTarget(null);
      }
    },
    [busyTarget, entryData, onClose],
  );

  if (!visible) return null;

  const isBusy = busyTarget !== null;

  return (
    <>
      {entryData ? <DiaryStoryCapture ref={storyCaptureRef} entryData={entryData} /> : null}

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.45}
            pressBehavior="close"
          />
        )}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Export your entry</Text>
            <Text style={styles.description}>Share with friends or save a copy</Text>
          </View>

          {isBusy ? (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.busyText}>Preparing your export...</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Export as PDF"
              style={[layout.btnPrimary, isBusy && styles.disabled]}
              disabled={isBusy}
              onPress={() => {
                void handleShare("more");
              }}
            >
              <Text style={layout.btnPrimaryText}>Export as PDF</Text>
            </Pressable>

            <View style={styles.targetGrid}>
              <ShareTarget
                label="WhatsApp"
                disabled={isBusy}
                onPress={() => {
                  void handleShare("whatsapp");
                }}
              />
              <ShareTarget
                label="Instagram Story"
                disabled={isBusy}
                onPress={() => {
                  void handleShare("instagram");
                }}
              />
              <ShareTarget
                label="Facebook Story"
                disabled={isBusy}
                onPress={() => {
                  void handleShare("facebook");
                }}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Not now"
              style={[layout.btnSecondary, isBusy && styles.disabled]}
              disabled={isBusy}
              onPress={onNotNow}
            >
              <Text style={layout.btnSecondaryText}>Not now</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

function ShareTarget({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.targetButton, disabled && styles.disabled]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={styles.targetText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    backgroundColor: colors.border,
    width: 44,
  },
  content: {
    paddingHorizontal: spacing.inner,
    paddingBottom: spacing.section,
    gap: spacing.inner,
  },
  header: {
    gap: 6,
  },
  title: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 26,
    color: colors.textPrimary,
  },
  description: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  busy: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.inner,
  },
  busyText: {
    fontFamily: fontFamilies.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.tapGap,
  },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.tapGap,
  },
  targetButton: {
    minHeight: 48,
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF7F2",
  },
  targetText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.primary,
  },
  disabled: {
    opacity: 0.45,
  },
});
