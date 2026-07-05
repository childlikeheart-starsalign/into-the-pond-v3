import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";

import { gateAssets } from "@/src/features/gate/gateAssets";
import { gateCardText, GATE_CARD_LINE_LIMITS } from "@/src/features/gate/gateCardText";
import { translateGateCopy } from "@/src/features/gate/gateCopy";
import {
  PRICING_CARD_CTA_DOWN_OFFSET,
  PRICING_CARD_CTA_RIGHT_SHIFT_RATIO,
  PRICING_CARD_CTA_TEXT_LEFT_SHIFT_RATIO,
  PRICING_CARD_HEIGHT_SPLIT,
  PRICING_CARD_MAX_FONT_SCALE,
  PRICING_CARD_PRICE_LABEL_DOWN_OFFSET,
  PRICING_CARD_PRICE_TO_CTA_GAP,
  PRICING_CARD_SPACING,
} from "@/src/features/gate/pricingCardFlexLayout";
import type { PricingCardViewModel } from "@/src/features/gate/types";
import { spacing } from "@/src/constants/theme";
import type { LogicalProductId } from "@/src/services/iap/catalog";

type PricingCardPurchaseFooterProps = {
  model: PricingCardViewModel;
  busyProductId: LogicalProductId | null;
  showPurchase: boolean;
  showUnavailable: boolean;
  isPremium: boolean;
  onPurchaseMonthly?: (productId: LogicalProductId) => void;
  onPurchaseLifetime?: (productId: LogicalProductId) => void;
};

function ctaAssetForState(state: PricingCardViewModel["state"]) {
  if (state === "recommended") return gateAssets.buttons.recommended;
  if (state === "unavailable") return gateAssets.buttons.disabled;
  return gateAssets.buttons.standard;
}

export function PricingCardPurchaseFooter({
  model,
  busyProductId,
  showPurchase,
  showUnavailable,
  isPremium,
  onPurchaseMonthly,
  onPurchaseLifetime,
}: PricingCardPurchaseFooterProps) {
  if (!showPurchase && !showUnavailable) return null;

  return (
    <View style={styles.footer}>
      <View style={styles.stack}>
        {showUnavailable ? (
          <Text style={gateCardText.body} maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}>
            {translateGateCopy("gate.cta.unavailable")}
          </Text>
        ) : (
          <>
            {!isPremium && model.monthlyAvailable && model.tier.monthlyProductId ? (
              <PurchaseOption
                priceLabel={model.monthlyPriceLabel}
                ctaLabel={translateGateCopy("gate.cta.chooseMonthly")}
                source={ctaAssetForState(model.state)}
                busy={busyProductId === model.tier.monthlyProductId}
                accessibilityLabel={`${translateGateCopy("gate.a11y.purchaseMonthly")} ${model.title}`}
                onPress={() => onPurchaseMonthly?.(model.tier.monthlyProductId!)}
              />
            ) : null}

            {model.lifetimeAvailable && model.tier.lifetimeProductId ? (
              <PurchaseOption
                priceLabel={model.lifetimePriceLabel}
                ctaLabel={translateGateCopy("gate.cta.chooseLifetime")}
                source={ctaAssetForState(model.state)}
                busy={busyProductId === model.tier.lifetimeProductId}
                accessibilityLabel={`${translateGateCopy("gate.a11y.purchaseLifetime")} ${model.title}`}
                onPress={() => onPurchaseLifetime?.(model.tier.lifetimeProductId!)}
              />
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

type PurchaseOptionProps = {
  priceLabel: string | null;
  ctaLabel: string;
  source: (typeof gateAssets.buttons)[keyof typeof gateAssets.buttons];
  busy: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

function PurchaseOption({
  priceLabel,
  ctaLabel,
  source,
  busy,
  accessibilityLabel,
  onPress,
}: PurchaseOptionProps) {
  return (
    <View style={styles.option}>
      {priceLabel ? (
        <View style={[gateCardText.priceBlock, styles.priceLabelDown]}>
          <Text
            style={gateCardText.price}
            numberOfLines={GATE_CARD_LINE_LIMITS.price}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}
          >
            {priceLabel}
          </Text>
        </View>
      ) : null}
      <GateCtaButton
        label={ctaLabel}
        source={source}
        busy={busy}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
      />
    </View>
  );
}

type GateCtaButtonProps = {
  label: string;
  source: (typeof gateAssets.buttons)[keyof typeof gateAssets.buttons];
  busy: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

function GateCtaButton({ label, source, busy, accessibilityLabel, onPress }: GateCtaButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.ctaPressable, styles.ctaDown, pressed && styles.pressed]}
    >
      <ImageBackground source={source} style={styles.ctaBackground} resizeMode="stretch">
        <Text
          style={[gateCardText.cta, styles.ctaTextShiftLeft]}
          numberOfLines={1}
          ellipsizeMode="tail"
          maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}
        >
          {busy ? "…" : label}
        </Text>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    flex: PRICING_CARD_HEIGHT_SPLIT.footer,
    minHeight: 0,
    width: "100%",
    paddingTop: PRICING_CARD_SPACING.featuresToFooter,
  },
  stack: {
    flex: 1,
    gap: PRICING_CARD_SPACING.monthlyToLifetime,
    justifyContent: "center",
  },
  option: {
    width: "100%",
    gap: PRICING_CARD_PRICE_TO_CTA_GAP,
  },
  priceLabelDown: {
    transform: [{ translateY: PRICING_CARD_PRICE_LABEL_DOWN_OFFSET }],
  },
  ctaDown: {
    transform: [{ translateY: PRICING_CARD_CTA_DOWN_OFFSET }],
  },
  ctaPressable: {
    marginLeft: `${PRICING_CARD_CTA_RIGHT_SHIFT_RATIO * 100}%`,
    width: `${(1 - PRICING_CARD_CTA_RIGHT_SHIFT_RATIO) * 100}%`,
    minHeight: 48,
  },
  ctaBackground: {
    width: "100%",
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.inner,
  },
  ctaTextShiftLeft: {
    marginLeft: `${-PRICING_CARD_CTA_TEXT_LEFT_SHIFT_RATIO * 100}%`,
  },
  pressed: {
    opacity: 0.88,
  },
});
