import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";

import { GateCardZone } from "@/src/features/gate/components/GateCardZone";
import { gateAssets } from "@/src/features/gate/gateAssets";
import { ACCOUNT_FOOTER_CARD_LAYOUT } from "@/src/features/gate/gateCardLayout";
import { translateGateCopy } from "@/src/features/gate/gateCopy";
import { colors, fontFamilies } from "@/src/constants/theme";

type AccountFooterProps = {
  accountId: string | null;
  signingOut: boolean;
  restoring: boolean;
  onSignOut: () => void;
  onRestore: () => void;
};

const FOOTER_ASPECT = 1200 / 400;

export function AccountFooter({
  accountId,
  signingOut,
  restoring,
  onSignOut,
  onRestore,
}: AccountFooterProps) {
  return (
    <View style={styles.wrap}>
      <ImageBackground
        source={gateAssets.cards.accountFooter}
        style={styles.card}
        resizeMode="stretch"
        accessibilityRole="summary"
        accessibilityLabel={translateGateCopy("gate.footer.accountId")}
      >
        <GateCardZone rect={ACCOUNT_FOOTER_CARD_LAYOUT.content}>
          <Text style={styles.label}>{translateGateCopy("gate.footer.accountId")}</Text>
        </GateCardZone>

        <GateCardZone rect={ACCOUNT_FOOTER_CARD_LAYOUT.accountId}>
          <Text style={styles.accountId} numberOfLines={1} ellipsizeMode="middle">
            {accountId ?? "—"}
          </Text>
        </GateCardZone>

        <GateCardZone rect={ACCOUNT_FOOTER_CARD_LAYOUT.signOut}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translateGateCopy("gate.footer.signOut")}
            accessibilityState={{ disabled: signingOut || !accountId, busy: signingOut }}
            disabled={signingOut || !accountId}
            onPress={onSignOut}
            style={({ pressed }) => [styles.btn, (pressed || signingOut) && styles.btnPressed]}
          >
            <Text style={styles.btnText}>
              {signingOut ? "…" : translateGateCopy("gate.footer.signOut")}
            </Text>
          </Pressable>
        </GateCardZone>

        <GateCardZone rect={ACCOUNT_FOOTER_CARD_LAYOUT.restore}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translateGateCopy("gate.footer.restore")}
            accessibilityState={{ disabled: restoring || !accountId, busy: restoring }}
            disabled={restoring || !accountId}
            onPress={onRestore}
            style={({ pressed }) => [
              styles.btnSecondary,
              (pressed || restoring) && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnSecondaryText}>
              {restoring ? "…" : translateGateCopy("gate.footer.restore")}
            </Text>
          </Pressable>
        </GateCardZone>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  card: {
    width: "100%",
    aspectRatio: FOOTER_ASPECT,
    overflow: "hidden",
  },
  label: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.textPrimary,
  },
  accountId: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  btn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnSecondary: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnPressed: {
    opacity: 0.82,
  },
  btnText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.surface,
  },
  btnSecondaryText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.primary,
  },
});
