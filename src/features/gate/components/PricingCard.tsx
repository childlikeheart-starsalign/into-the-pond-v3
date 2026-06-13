import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";

import { GateCardShell } from "@/src/features/gate/components/GateCardShell";
import { PricingCardPurchaseFooter } from "@/src/features/gate/components/PricingCardPurchaseFooter";
import { gateCardFlexStyles } from "@/src/features/gate/gateCardFlexStyles";
import { gateAssets, gateIconSource, gateIllustrationSource } from "@/src/features/gate/gateAssets";
import { gateCardText, GATE_CARD_LINE_LIMITS } from "@/src/features/gate/gateCardText";
import { translateGateCopy } from "@/src/features/gate/gateCopy";
import {
  FIBERGLASS_ROD_TEXT_UP_OFFSET,
  LIFETIME_ACCESS_TITLE_DOWN_OFFSET,
  PRICING_CARD_HEIGHT_SPLIT,
  PRICING_CARD_MAX_FONT_SCALE,
  PRICING_CARD_ROD_ILLUSTRATION_SCALE,
} from "@/src/features/gate/pricingCardFlexLayout";
import type { PricingCardViewModel } from "@/src/features/gate/types";
import { spacing } from "@/src/constants/theme";
import type { LogicalProductId } from "@/src/services/iap/catalog";
import type { GateIllustrationAssetKey } from "@/src/features/gate/gateAssets";

function isRodIllustration(asset: GateIllustrationAssetKey): boolean {
  return asset === "woodenRod" || asset === "fiberglassRod";
}

type PricingCardProps = {
  model: PricingCardViewModel;
  busyProductId: LogicalProductId | null;
  onPurchaseMonthly?: (productId: LogicalProductId) => void;
  onPurchaseLifetime?: (productId: LogicalProductId) => void;
};

export function PricingCard({
  model,
  busyProductId,
  onPurchaseMonthly,
  onPurchaseLifetime,
}: PricingCardProps) {
  const isPremium = model.tier.cardType === "premium";
  const cardSource = isPremium ? gateAssets.cards.pricingPremium : gateAssets.cards.pricingStandard;

  const showPurchase = model.state !== "owned" && model.state !== "unavailable";
  const showUnavailable = model.state === "unavailable";
  const showFooter = showPurchase || showUnavailable;

  const badgeSource =
    model.state === "owned"
      ? gateAssets.badges.waxSealOwned
      : model.state === "recommended"
        ? gateAssets.badges.waxSealActive
        : null;

  const ribbonSource =
    model.tier.badgeAsset === "ribbonMostChosen"
      ? gateAssets.badges.ribbonMostChosen
      : model.tier.badgeAsset === "ribbonBestValue"
        ? gateAssets.badges.ribbonBestValue
        : null;

  const sealLabel =
    model.state === "owned"
      ? translateGateCopy("gate.badges.owned")
      : model.state === "recommended"
        ? translateGateCopy("gate.badges.currentPlan")
        : null;

  const isRod = isRodIllustration(model.tier.illustrationAsset);
  const isFiberglass = model.tier.id === "fiberglass";
  const isLifetime = model.tier.id === "lifetime";
  const rodScalePercent = `${PRICING_CARD_ROD_ILLUSTRATION_SCALE * 100}%`;

  return (
    <GateCardShell
      source={cardSource}
      accessibilityLabel={`${translateGateCopy("gate.a11y.pricingCard")}: ${model.title}`}
    >
      <View style={gateCardFlexStyles.cardBody}>
        <View style={[styles.contentArea, !showFooter && styles.contentAreaExpanded]}>
          {(ribbonSource || badgeSource) && (
            <View style={styles.badgeRow}>
              <View style={styles.badgeRowSpacer} />
              {ribbonSource ? (
                <Image
                  source={ribbonSource}
                  style={styles.ribbon}
                  resizeMode="contain"
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : null}
              {badgeSource && sealLabel ? (
                <WaxSealBadge source={badgeSource} label={sealLabel} />
              ) : null}
            </View>
          )}

          <View style={gateCardFlexStyles.topSection}>
            <View style={gateCardFlexStyles.illustrationSlot}>
              <Image
                source={gateIllustrationSource(model.tier.illustrationAsset)}
                style={[
                  gateCardFlexStyles.illustration,
                  isRod && { width: rodScalePercent, height: rodScalePercent },
                ]}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>

            <View
              style={[
                gateCardFlexStyles.headerBlock,
                gateCardFlexStyles.textShiftLeft,
                gateCardFlexStyles.textShiftUp,
                isFiberglass && styles.fiberglassTextShiftUp,
              ]}
            >
              <Text
                style={[gateCardText.title, isLifetime && styles.lifetimeTitleShiftDown]}
                numberOfLines={GATE_CARD_LINE_LIMITS.title}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}
              >
                {model.title}
              </Text>
              <Text
                style={[gateCardText.body, gateCardFlexStyles.stackedTextGap]}
                numberOfLines={GATE_CARD_LINE_LIMITS.description}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}
              >
                {model.description}
              </Text>
              <View style={gateCardFlexStyles.featureList}>
                {model.features.map((feature) => (
                  <View key={feature.label} style={gateCardText.featureRow}>
                    <Image
                      source={gateIconSource(feature.iconAsset)}
                      style={gateCardText.featureListIcon}
                      resizeMode="contain"
                      accessibilityIgnoresInvertColors
                    />
                    <Text
                      style={gateCardText.featureList}
                      numberOfLines={GATE_CARD_LINE_LIMITS.featureList}
                      ellipsizeMode="tail"
                      maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}
                    >
                      {feature.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {showFooter ? (
          <PricingCardPurchaseFooter
            model={model}
            busyProductId={busyProductId}
            showPurchase={showPurchase}
            showUnavailable={showUnavailable}
            isPremium={isPremium}
            onPurchaseMonthly={onPurchaseMonthly}
            onPurchaseLifetime={onPurchaseLifetime}
          />
        ) : null}
      </View>
    </GateCardShell>
  );
}

type WaxSealBadgeProps = {
  source: (typeof gateAssets.badges)[keyof typeof gateAssets.badges];
  label: string;
};

function WaxSealBadge({ source, label }: WaxSealBadgeProps) {
  return (
    <ImageBackground source={source} style={styles.waxSeal} resizeMode="contain">
      <View style={styles.waxSealLabel}>
        <Text
          style={gateCardText.cta}
          numberOfLines={1}
          ellipsizeMode="tail"
          maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}
        >
          {label}
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  contentArea: {
    flex: PRICING_CARD_HEIGHT_SPLIT.content,
    minHeight: 0,
  },
  contentAreaExpanded: {
    flex: 1,
  },
  fiberglassTextShiftUp: {
    transform: [{ translateY: -FIBERGLASS_ROD_TEXT_UP_OFFSET }],
  },
  lifetimeTitleShiftDown: {
    marginTop: LIFETIME_ACCESS_TITLE_DOWN_OFFSET,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    gap: spacing.tapGap,
    minHeight: 40,
  },
  badgeRowSpacer: {
    flex: 1,
  },
  ribbon: {
    width: 72,
    height: 48,
  },
  waxSeal: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  waxSealLabel: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
});
