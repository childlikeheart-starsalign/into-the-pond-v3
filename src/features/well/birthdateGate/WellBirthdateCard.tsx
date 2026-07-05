import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

import { narrativeContent } from "@/src/constants/narrative/narrativeContent";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, fontFamilies } from "@/src/constants/theme";
import {
  pondColor,
  wellBirthdateLayout,
} from "@/src/features/well/birthdateGate/wellBirthdateTokens";
import { WELL_BIRTHDATE_CARD, WELL_BIRTHDATE_CARD_ASPECT } from "@/src/features/well/wellAssets";

type WellBirthdateCardProps = {
  monthLabel: string;
  yearLabel: string;
  monthPlaceholder: string;
  yearPlaceholder: string;
  continueLabel: string;
  canContinue: boolean;
  previewText?: string | null;
  errorText?: string | null;
  onPressMonth: () => void;
  onPressYear: () => void;
  onContinue: () => void;
};

type CardSize = { width: number; height: number };

function CardFieldRow({
  title,
  value,
  placeholder,
  onPress,
}: {
  title: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  const isPlaceholder = value === placeholder;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${title.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [styles.fieldRow, pressed && styles.fieldRowPressed]}
    >
      <Text style={styles.fieldLabel}>{title}</Text>
      <View style={styles.fieldValueRow}>
        <Text
          style={[styles.fieldValue, isPlaceholder && styles.fieldPlaceholder]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Ionicons name="chevron-down" size={16} color={pondColor.sage} />
      </View>
      <View style={styles.fieldRule} />
    </Pressable>
  );
}

export function WellBirthdateCard({
  monthLabel,
  yearLabel,
  monthPlaceholder,
  yearPlaceholder,
  continueLabel,
  canContinue,
  previewText,
  errorText,
  onPressMonth,
  onPressYear,
  onContinue,
}: WellBirthdateCardProps) {
  const copy = narrativeContent.childBirthDate;
  const [cardSize, setCardSize] = useState<CardSize>({ width: 0, height: 0 });

  const contentBox = useMemo(() => {
    if (cardSize.width <= 0 || cardSize.height <= 0) return null;
    const frame = wellBirthdateLayout.cardInnerFrame;
    const margin = wellBirthdateLayout.cardTextMargin;
    const left = cardSize.width * frame.left + margin;
    const top = cardSize.height * frame.top + margin + 20;
    const width = cardSize.width * (frame.right - frame.left) - margin * 2;
    const height = cardSize.height * (frame.bottom - frame.top) - margin * 2;
    return { left, top, width, height };
  }, [cardSize]);

  const continueBox = useMemo(() => {
    if (!contentBox || cardSize.width <= 0 || cardSize.height <= 0) return null;
    const widthScale = cardSize.width / 682;
    const top =
      cardSize.height * wellBirthdateLayout.cardArtDividerBottom +
      wellBirthdateLayout.cardContinueGapBelowDivider * widthScale;
    return { left: contentBox.left, top, width: contentBox.width };
  }, [cardSize, contentBox]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCardSize({ width, height });
  };

  return (
    <View
      style={styles.scaleWrap}
      accessibilityLabel="Well birth date card"
      onLayout={handleLayout}
    >
      <View style={styles.wrap}>
        <Image source={WELL_BIRTHDATE_CARD} style={styles.card} resizeMode="contain" />
        {contentBox ? (
          <View
            style={[
              styles.content,
              {
                left: contentBox.left,
                top: contentBox.top,
                width: contentBox.width,
                height: contentBox.height,
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.headline}>
                Before the Well can <Text style={styles.speakAccent}>speak</Text>
              </Text>
              <Text style={styles.subtext}>{copy.wellGateSubtext}</Text>
            </View>

            <View style={styles.form}>
              <CardFieldRow
                title="MONTH"
                value={monthLabel}
                placeholder={monthPlaceholder}
                onPress={onPressMonth}
              />
              <CardFieldRow
                title="YEAR"
                value={yearLabel}
                placeholder={yearPlaceholder}
                onPress={onPressYear}
              />
            </View>
          </View>
        ) : null}
      </View>
      {continueBox ? (
        <View
          style={[
            styles.continueWrap,
            {
              left: continueBox.left,
              top: continueBox.top,
              width: continueBox.width,
            },
          ]}
        >
          <PrimaryButton
            label={continueLabel}
            accessibilityLabel="Save birth date and continue to Well"
            disabled={!canContinue}
            onPress={onContinue}
            style={styles.continuePrimary}
          />
          {previewText || errorText ? (
            <View style={styles.footer}>
              {previewText ? <Text style={styles.preview}>{previewText}</Text> : null}
              {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const scale = wellBirthdateLayout.cardScale;

const styles = StyleSheet.create({
  scaleWrap: {
    width: `${scale * 100}%`,
    alignSelf: "center",
    marginHorizontal: `${-((scale - 1) / 2) * 100}%`,
    position: "relative",
  },
  wrap: {
    width: "100%",
    aspectRatio: WELL_BIRTHDATE_CARD_ASPECT,
    backgroundColor: "transparent",
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  content: {
    position: "absolute",
    gap: wellBirthdateLayout.cardGap,
  },
  header: {
    gap: 8,
    alignItems: "center",
  },
  headline: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: wellBirthdateLayout.headlineSize,
    letterSpacing: -0.02 * wellBirthdateLayout.headlineSize,
    color: pondColor.ink,
    lineHeight: wellBirthdateLayout.headlineSize * 1.15,
    textAlign: "center",
  },
  speakAccent: {
    fontFamily: fontFamilies.handwritten,
    fontSize: wellBirthdateLayout.speakAccentSize,
    color: pondColor.sage,
    textDecorationLine: "underline",
    textDecorationColor: pondColor.sage,
  },
  subtext: {
    fontFamily: fontFamilies.body,
    fontSize: wellBirthdateLayout.subtextSize,
    lineHeight: wellBirthdateLayout.subtextSize + wellBirthdateLayout.lineSpacing,
    color: pondColor.body,
    textAlign: "center",
    opacity: 0.7,
  },
  form: {
    gap: wellBirthdateLayout.cardGap,
  },
  continueWrap: {
    position: "absolute",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
    elevation: 10,
  },
  continuePrimary: {
    width: "100%",
  },
  continuePill: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.9,
  },
  continuePillDisabled: {
    opacity: 0.45,
  },
  continuePillPressed: {
    opacity: 0.85,
  },
  continuePillText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: pondColor.body,
  },
  fieldRow: {
    gap: 6,
    minHeight: 52,
    justifyContent: "center",
  },
  fieldRowPressed: {
    opacity: 0.85,
  },
  fieldLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: wellBirthdateLayout.fieldLabelSize,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: pondColor.sage,
  },
  fieldValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  fieldValue: {
    flex: 1,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: wellBirthdateLayout.fieldValueSize,
    letterSpacing: 1,
    color: pondColor.ink,
  },
  fieldPlaceholder: {
    color: pondColor.body,
    opacity: 0.55,
  },
  fieldRule: {
    height: 1,
    backgroundColor: pondColor.inkRule,
  },
  footer: {
    gap: 6,
  },
  preview: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: pondColor.body,
    textAlign: "center",
    opacity: 0.85,
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: pondColor.body,
    textAlign: "center",
  },
});
