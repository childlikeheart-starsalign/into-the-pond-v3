import { Image, Text, View } from "react-native";

import { GateCardShell } from "@/src/features/gate/components/GateCardShell";
import { gateCardFlexStyles } from "@/src/features/gate/gateCardFlexStyles";
import { gateAssets } from "@/src/features/gate/gateAssets";
import { gateCardText, GATE_CARD_LINE_LIMITS } from "@/src/features/gate/gateCardText";
import { PRICING_CARD_MAX_FONT_SCALE } from "@/src/features/gate/pricingCardFlexLayout";
import type { CurrentAccessViewModel } from "@/src/features/gate/types";

type CurrentAccessCardProps = {
  model: CurrentAccessViewModel;
  onLayout?: (height: number) => void;
};

export function CurrentAccessCard({ model, onLayout }: CurrentAccessCardProps) {
  return (
    <View
      onLayout={(event) => {
        onLayout?.(event.nativeEvent.layout.height);
      }}
      accessibilityRole="summary"
      accessibilityLabel={`${model.title}. ${model.activeTierLabel}. ${model.description}`}
    >
      <GateCardShell source={gateAssets.cards.currentAccess} accessibilityLabel={model.title}>
        <View style={gateCardFlexStyles.cardBody}>
          <View style={gateCardFlexStyles.contentArea}>
            <View style={gateCardFlexStyles.topSection}>
              <View
                style={[
                  gateCardFlexStyles.illustrationSlot,
                  gateCardFlexStyles.currentAccessIllustrationShiftDown,
                ]}
              >
                <Image
                  source={gateAssets.illustrations.cottage}
                  style={gateCardFlexStyles.illustration}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>

              <View
                style={[
                  gateCardFlexStyles.headerBlock,
                  gateCardFlexStyles.textShiftLeft,
                  gateCardFlexStyles.currentAccessTextShiftDown,
                ]}
              >
                <Text
                  style={gateCardText.title}
                  numberOfLines={GATE_CARD_LINE_LIMITS.title}
                  ellipsizeMode="tail"
                  maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}
                >
                  {model.title}
                </Text>
                <Text
                  style={[gateCardText.subtitle, gateCardFlexStyles.stackedTextGap]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}
                >
                  {model.activeTierLabel}
                </Text>
                <Text
                  style={[gateCardText.body, gateCardFlexStyles.stackedTextGap]}
                  numberOfLines={GATE_CARD_LINE_LIMITS.description}
                  ellipsizeMode="tail"
                  maxFontSizeMultiplier={PRICING_CARD_MAX_FONT_SCALE}
                >
                  {model.description}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </GateCardShell>
    </View>
  );
}
