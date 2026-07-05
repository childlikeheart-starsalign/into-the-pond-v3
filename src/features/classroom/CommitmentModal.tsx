import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, layout, spacing } from "@/src/constants/theme";

type CommitmentModalProps = {
  visible: boolean;
  lessonTitle?: string | null;
  onDismiss: () => void;
  onConfirm: () => void;
};

export function CommitmentModal({
  visible,
  lessonTitle,
  onDismiss,
  onConfirm,
}: CommitmentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        style={sheetStyles.backdrop}
        onPress={onDismiss}
        accessibilityLabel="Dismiss commitment dialog"
      >
        <Pressable style={sheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={layout.screenTitle}>Commitment</Text>
          <Text style={layout.subtitle}>
            {lessonTitle
              ? `Before ${lessonTitle}, pause and set an intention for this lesson.`
              : "Pause and set an intention before you continue."}
          </Text>
          <Text style={layout.muted}>
            This is a placeholder—copy and pacing will match your full commitment gate later.
          </Text>
          <View style={{ gap: spacing.tapGap, marginTop: spacing.inner }}>
            <PrimaryButton
              label="I am ready"
              accessibilityLabel="Confirm commitment and start lesson"
              onPress={onConfirm}
            />
            <Pressable style={layout.btnSecondary} onPress={onDismiss} accessibilityLabel="Not now">
              <Text style={layout.btnSecondaryText}>Not now</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(31, 26, 23, 0.45)",
    justifyContent: "center",
    padding: spacing.inner,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: spacing.inner,
  },
});
