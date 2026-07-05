import { useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { translateGateCopy } from "@/src/features/gate/gateCopy";
import { requestAccountDeletionAndSignOut } from "@/src/services/auth/accountDeletion";

const DELETE_CONFIRM_TEXT = "DELETE";
const DELETE_ACCOUNT_WEB_URL = "https://intothepond.app/delete-account";

type DeleteAccountSectionProps = {
  disabled?: boolean;
};

export function DeleteAccountSection({ disabled = false }: DeleteAccountSectionProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledMessage, setScheduledMessage] = useState<string | null>(null);

  const canConfirm = confirmText.trim().toUpperCase() === DELETE_CONFIRM_TEXT && !busy;

  const handleOpenSheet = () => {
    setConfirmText("");
    setError(null);
    setSheetVisible(true);
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      const result = await requestAccountDeletionAndSignOut();
      setSheetVisible(false);
      const purgeDate = result.purgeAt
        ? new Date(result.purgeAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : null;
      setScheduledMessage(
        purgeDate
          ? translateGateCopy("gate.delete.scheduled").replace("{date}", purgeDate)
          : translateGateCopy("gate.delete.scheduledFallback"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : translateGateCopy("gate.delete.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {scheduledMessage ? (
        <Text style={styles.scheduled} accessibilityLiveRegion="polite">
          {scheduledMessage}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translateGateCopy("gate.delete.open")}
        disabled={disabled || busy}
        onPress={handleOpenSheet}
        style={({ pressed }) => [styles.deleteLink, (pressed || disabled) && styles.pressed]}
      >
        <Text style={styles.deleteLinkText}>{translateGateCopy("gate.delete.open")}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={translateGateCopy("gate.delete.webLink")}
        onPress={() => void Linking.openURL(DELETE_ACCOUNT_WEB_URL)}
        style={({ pressed }) => [styles.webLink, pressed && styles.pressed]}
      >
        <Text style={styles.webLinkText}>{translateGateCopy("gate.delete.webLink")}</Text>
      </Pressable>

      <Modal
        visible={sheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSheetVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{translateGateCopy("gate.delete.sheetTitle")}</Text>
            <Text style={styles.sheetBody}>{translateGateCopy("gate.delete.sheetBody")}</Text>
            <Text style={styles.sheetNote}>
              {translateGateCopy("gate.delete.subscriptionNote")}
            </Text>

            <Text style={styles.confirmLabel}>{translateGateCopy("gate.delete.confirmLabel")}</Text>
            <TextInput
              style={styles.confirmInput}
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!busy}
              accessibilityLabel={translateGateCopy("gate.delete.confirmLabel")}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={translateGateCopy("gate.delete.cancel")}
                disabled={busy}
                onPress={() => setSheetVisible(false)}
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              >
                <Text style={styles.cancelBtnText}>{translateGateCopy("gate.delete.cancel")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={translateGateCopy("gate.delete.confirm")}
                disabled={!canConfirm}
                onPress={() => void handleConfirm()}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  (!canConfirm || pressed) && styles.confirmBtnDisabled,
                ]}
              >
                <Text style={styles.confirmBtnText}>
                  {busy ? "…" : translateGateCopy("gate.delete.confirm")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.inner,
    alignItems: "center",
  },
  scheduled: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  deleteLink: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.inner,
  },
  deleteLinkText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.dangerSoft,
    textDecorationLine: "underline",
  },
  webLink: {
    minHeight: 44,
    justifyContent: "center",
  },
  webLinkText: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.82,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(31, 26, 23, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: spacing.inner,
  },
  sheetTitle: {
    fontFamily: fontFamilies.gateTitle,
    fontSize: 22,
    letterSpacing: -0.44,
    color: colors.textPrimary,
  },
  sheetBody: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  sheetNote: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.warning,
  },
  confirmLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.textPrimary,
  },
  confirmInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.dangerSoft,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.inner,
    marginTop: spacing.section - spacing.inner,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
  },
  confirmBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: colors.surface,
  },
});
