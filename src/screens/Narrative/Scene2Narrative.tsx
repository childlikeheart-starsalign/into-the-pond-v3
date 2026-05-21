import React from "react";
import { ImageSourcePropType } from "react-native";

import {
  NarrativeStepView,
  NarrativeStepViewProps,
  OnboardingStepContentProps,
} from "@/src/components/narrative/NarrativeStepView";
import { SCENE_2_PARAGRAPHS } from "@/src/constants/narrative/day1Content";
import { ChildArchetype } from "@/src/constants/narrative/types";
import { useOnboardingNavigation } from "@/src/hooks/useOnboardingNavigation";
import { media } from "@/src/constants/media";

type Scene2NarrativeProps = {
  childArchetype: ChildArchetype;
  onComplete: () => void;
  /**
   * Override archetype-specific background images.
   * Defaults to sanctuary placeholder frames; swap in final art here.
   */
  backgroundImages?: Record<ChildArchetype, ImageSourcePropType>;
  /**
   * Provide a fully custom layout. Receives the full navigation state.
   * When supplied, the default Pressable wrapper and default UI are skipped.
   */
  renderContent?: (props: OnboardingStepContentProps) => React.ReactNode;
  /** Pass-through to NarrativeStepView for fine-grained style/render overrides. */
  viewProps?: Partial<NarrativeStepViewProps>;
};

/** Scene 2: The Child Who Follows — archetype-branched tap-to-advance narrative. */
export function Scene2Narrative({
  childArchetype,
  onComplete,
  backgroundImages = media.narrative.scene2,
  renderContent,
  viewProps,
}: Scene2NarrativeProps) {
  const paragraphs = SCENE_2_PARAGRAPHS[childArchetype];

  // ANIMATION PLACEHOLDER: scene entrance transition before first paragraph appears.
  const nav = useOnboardingNavigation({ paragraphs, onComplete });

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
      backgroundImage={backgroundImages[childArchetype]}
      renderContent={renderContent}
      {...viewProps}
    />
  );
}
