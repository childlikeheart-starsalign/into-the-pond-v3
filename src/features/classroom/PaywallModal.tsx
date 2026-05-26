import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, layout, spacing } from "@/src/constants/theme";

type PaywallModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={sheetStyles.backdrop}
        onPress={onClose}
        accessibilityLabel="Dismiss upgrade dialog"
      >
        <Pressable style={sheetStyles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={layout.screenTitle}>Upgrade to Premium</Text>
          <Text style={layout.subtitle}>
            This lesson is part of the full curriculum. Upgrade to unlock every module and lesson.
          </Text>
          <View style={{ gap: spacing.tapGap, marginTop: spacing.inner }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upgrade to premium"
              style={layout.btnPrimary}
              onPress={() => {
                /* ADD PURCHASE LOGIC HERE */
              }}
            >
              <Text style={layout.btnPrimaryText}>Upgrade to Premium</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={layout.btnSecondary}
              onPress={onClose}
            >
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
