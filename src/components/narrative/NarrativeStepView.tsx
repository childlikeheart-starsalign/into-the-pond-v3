import React from "react";
import {
  ImageSourcePropType,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { NarrativeProgressDots } from "./NarrativeProgressDots";
import { NarrativeTapHint } from "./NarrativeTapHint";

// ---------------------------------------------------------------------------
// Render-content types
// ---------------------------------------------------------------------------

/**
 * Full navigation state passed to renderContent.
 * Implement this to drop in any custom visual design without touching logic.
 */
export type OnboardingStepContentProps = {
  paragraph: string;
  paragraphIndex: number;
  totalParagraphs: number;
  isLastStep: boolean;
  isFirstStep: boolean;
  /** Advance to next paragraph, or complete the scene on the last. */
  goToNext: () => void;
  /** Go back one paragraph (no-op on first). */
  goToPrevious: () => void;
  /** Skip straight to completion without stepping through remaining paragraphs. */
  completeOnboarding: () => void;
};

// ---------------------------------------------------------------------------
// Style override / theme types
// ---------------------------------------------------------------------------

export type NarrativeStepViewStyleOverrides = {
  container?: ViewStyle;
  paragraph?: TextStyle;
  progressRow?: ViewStyle;
  progressDot?: ViewStyle;
  progressDotActive?: ViewStyle;
  hint?: TextStyle;
};

export type NarrativeStepViewTheme = {
  background?: string;
  paragraphColor?: string;
  hintColor?: string;
  dotColor?: string;
  dotActiveColor?: string;
};

// ---------------------------------------------------------------------------
// Main prop type
// ---------------------------------------------------------------------------

export type NarrativeStepViewProps = {
  paragraph: string;
  paragraphIndex: number;
  totalParagraphs: number;
  isLast: boolean;
  isFirst?: boolean;

  /** Called when the user taps to advance (or when renderContent's goToNext is used). */
  onTap: () => void;
  /** Called when the user requests to go back one paragraph. */
  onBack?: () => void;
  /** Called to skip straight to completion. */
  onComplete?: () => void;

  backgroundImage?: ImageSourcePropType;
  styleOverrides?: NarrativeStepViewStyleOverrides;
  theme?: NarrativeStepViewTheme;

  /**
   * Replace the ENTIRE inner content (paragraph + progress + hint) with a custom layout.
   * Receives full nav state. When provided the outer Pressable wrapper is removed
   * so your custom UI handles interaction.
   *
   * Example:
   *   renderContent={({ paragraph, goToNext, isLastStep }) => (
   *     <MyAnimatedCard onPress={goToNext}>
   *       <AnimatedText>{paragraph}</AnimatedText>
   *     </MyAnimatedCard>
   *   )}
   */
  renderContent?: (props: OnboardingStepContentProps) => React.ReactNode;

  /** Replace just the paragraph Text node. */
  renderParagraph?: (paragraph: string) => React.ReactNode;
  /** Replace just the progress indicator. */
  renderProgress?: (index: number, total: number) => React.ReactNode;
  /** Replace the entire background layer (e.g. video, animated bg). */
  renderBackground?: () => React.ReactNode;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Minimal, fully-configurable presentation shell for a single narrative paragraph.
 *
 * Swappability levels (outermost → innermost):
 *   1. renderBackground  — swap the background layer
 *   2. renderContent     — swap everything inside (full custom layout, no Pressable wrapper)
 *   3. renderParagraph   — swap just the text node
 *   4. renderProgress    — swap just the progress dots
 *   5. styleOverrides / theme — tweak colours/spacing without replacing markup
 *
 * Business logic lives in useOnboardingNavigation — this component is pure presentation.
 */
export function NarrativeStepView({
  paragraph,
  paragraphIndex,
  totalParagraphs,
  isLast,
  isFirst = false,
  onTap,
  onBack,
  onComplete,
  backgroundImage,
  styleOverrides = {},
  theme = {},
  renderContent,
  renderParagraph,
  renderProgress,
  renderBackground,
}: NarrativeStepViewProps) {
  // ---------------------------------------------------------------------------
  // Custom renderContent path — full layout control, no Pressable wrapper.
  // ---------------------------------------------------------------------------
  if (renderContent) {
    const contentProps: OnboardingStepContentProps = {
      paragraph,
      paragraphIndex,
      totalParagraphs,
      isLastStep: isLast,
      isFirstStep: isFirst,
      goToNext: onTap,
      goToPrevious: onBack ?? (() => {}),
      completeOnboarding: onComplete ?? onTap,
    };

    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* ANIMATION PLACEHOLDER: background entrance transition */}
        {renderBackground ? renderBackground() : null}
        {backgroundImage && !renderBackground ? (
          <ImageBackground
            source={backgroundImage}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : null}
        {/* ANIMATION PLACEHOLDER: content container slide/fade in */}
        {renderContent(contentProps)}
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Default path — full-screen tap-to-advance Pressable.
  // ---------------------------------------------------------------------------
  const defaultContent = (
    <Pressable
      style={[styles.tapArea, styleOverrides.container]}
      onPress={onTap}
      accessibilityRole="button"
      accessibilityLabel={isLast ? "Tap to complete" : "Tap to continue"}
    >
      {/* ANIMATION PLACEHOLDER: inner content fade/slide in on paragraph change */}
      <View style={styles.inner}>
        {renderParagraph ? (
          renderParagraph(paragraph)
        ) : (
          // ANIMATION PLACEHOLDER: paragraph text fade-in or typewriter effect.
          <Text
            style={[
              styles.paragraph,
              theme.paragraphColor ? { color: theme.paragraphColor } : undefined,
              styleOverrides.paragraph,
            ]}
          >
            {paragraph}
          </Text>
        )}

        {renderProgress ? (
          renderProgress(paragraphIndex, totalParagraphs)
        ) : (
          // ANIMATION PLACEHOLDER: dots animate position/opacity on step change.
          <NarrativeProgressDots
            currentStep={paragraphIndex}
            totalSteps={totalParagraphs}
            activeColor={theme.dotActiveColor}
            inactiveColor={theme.dotColor}
            style={styleOverrides.progressRow}
          />
        )}

        {/* ANIMATION PLACEHOLDER: hint pulses or fades in after paragraph settles */}
        <NarrativeTapHint
          isLastStep={isLast}
          style={[theme.hintColor ? { color: theme.hintColor } : undefined, styleOverrides.hint]}
        />
      </View>
    </Pressable>
  );

  if (renderBackground) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* ANIMATION PLACEHOLDER: background entrance transition */}
        {renderBackground()}
        {defaultContent}
      </SafeAreaView>
    );
  }

  if (backgroundImage) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* ANIMATION PLACEHOLDER: background crossfade between scenes */}
        <ImageBackground
          source={backgroundImage}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {defaultContent}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        theme.background ? { backgroundColor: theme.background } : undefined,
      ]}
      edges={["top", "bottom"]}
    >
      {defaultContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tapArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.inner,
  },
  inner: {
    alignItems: "center",
    gap: spacing.section,
  },
  paragraph: {
    fontFamily: fontFamilies.body,
    fontSize: 20,
    lineHeight: 32,
    color: colors.textPrimary,
    textAlign: "center",
    maxWidth: "90%",
  },
});
