import React from "react";
import { ImageSourcePropType } from "react-native";

import {
  NarrativeStepView,
  NarrativeStepViewProps,
  OnboardingStepContentProps,
} from "@/src/components/narrative/NarrativeStepView";
import { SCENE_1_PARAGRAPHS } from "@/src/constants/narrative/day1Content";
import { ChildArchetype } from "@/src/constants/narrative/types";
import { useOnboardingNavigation } from "@/src/hooks/useOnboardingNavigation";
import { media } from "@/src/constants/media";

type Scene1NarrativeProps = {
  onComplete: () => void;
  backgroundImage?: ImageSourcePropType;
  /**
   * Provide a fully custom layout. Receives the full navigation state.
   * When supplied, the default Pressable wrapper and default UI are skipped.
   *
   * Example:
   *   renderContent={({ paragraph, goToNext, isLastStep }) => (
   *     <MyCard onPress={goToNext}><AnimatedText>{paragraph}</AnimatedText></MyCard>
   *   )}
   */
  renderContent?: (props: OnboardingStepContentProps) => React.ReactNode;
  /** Pass-through to NarrativeStepView for fine-grained style/render overrides. */
  viewProps?: Partial<NarrativeStepViewProps>;
  /** Unused in Scene 1 (universal narrative), kept for interface consistency. */
  childArchetype?: ChildArchetype;
};

/** Scene 1: The Finding — universal tap-to-advance narrative. */
export function Scene1Narrative({
  onComplete,
  backgroundImage = media.narrative.sanctuaryBg,
  renderContent,
  viewProps,
}: Scene1NarrativeProps) {
  // ANIMATION PLACEHOLDER: scene entrance transition before first paragraph appears.
  const nav = useOnboardingNavigation({
    paragraphs: SCENE_1_PARAGRAPHS,
    onComplete,
  });

  return (
    <NarrativeStepView
      paragraph={nav.currentParagraph}
      paragraphIndex={nav.currentStep}
      totalParagraphs={nav.totalSteps}
      isLast={nav.isLastStep}
      isFirst={nav.isFirstStep}
      onTap={nav.goToNext}
      onBack={nav.goToPrevious}
      onComplete={nav.completeOnboarding}
      backgroundImage={backgroundImage}
      renderContent={renderContent}
      {...viewProps}
    />
  );
}
