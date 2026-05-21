import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ARCHETYPE_OPTIONS } from "@/src/constants/narrative/archetypes";
import { narrativeContent } from "@/src/constants/narrative/narrativeContent";
import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { ChildArchetype } from "@/src/constants/narrative/types";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";

type ArchetypeSelectorProps = {
  onSelect: (archetype: ChildArchetype) => void;
};

/**
 * One-decision screen: parent selects their child's primary pattern.
 * Results are persisted by the caller via useNarrativeOnboarding.selectArchetype.
 */
export function ArchetypeSelector({ onSelect }: ArchetypeSelectorProps) {
  return (
    <Portrait916Frame>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ANIMATION PLACEHOLDER: header fades/slides in on mount. */}
          <View style={styles.header}>
            <Text style={styles.headline}>{narrativeContent.archetypeSelector.headline}</Text>
            <Text style={styles.subtext}>{narrativeContent.archetypeSelector.subtext}</Text>
          </View>

          {/* ANIMATION PLACEHOLDER: choice buttons stagger-animate in. */}
          <View style={styles.choices}>
            {ARCHETYPE_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={({ pressed }) => [styles.choiceBtn, pressed && styles.choiceBtnPressed]}
                onPress={() => onSelect(option.id)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityHint={option.description}
              >
                <Text style={styles.choiceLabel}>{option.label}</Text>
                <Text style={styles.choiceDescription}>{option.description}</Text>
              </Pressable>
            ))}
          </View>

          {/* ANIMATION PLACEHOLDER: reassurance text fades in after choices appear. */}
          <Text style={styles.reassurance}>{narrativeContent.archetypeSelector.reassurance}</Text>
        </ScrollView>
      </SafeAreaView>
    </Portrait916Frame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.section,
    paddingBottom: spacing.section * 2,
    gap: spacing.section,
  },
  header: {
    gap: spacing.inner,
  },
  headline: {
    fontFamily: fontFamilies.heading,
    fontSize: 28,
    letterSpacing: -0.02 * 28,
    color: colors.textPrimary,
  },
  subtext: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  choices: {
    gap: spacing.inner,
  },
  choiceBtn: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.cardPadding ?? 20,
    gap: 6,
  },
  choiceBtnPressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  choiceLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.textPrimary,
  },
  choiceDescription: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  reassurance: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    opacity: 0.7,
    paddingHorizontal: spacing.inner,
  },
});
