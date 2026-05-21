import React from "react";
import { ImageSourcePropType } from "react-native";

import {
  NarrativeStepView,
  NarrativeStepViewProps,
  OnboardingStepContentProps,
} from "@/src/components/narrative/NarrativeStepView";
import {
  SCENE_3_PARAGRAPHS,
  SCENE_4_PARAGRAPHS,
  SCENE_5_PARAGRAPHS,
  SCENE_6_PARAGRAPHS,
} from "@/src/constants/narrative/day1Content";
import { ChildArchetype, SceneNumber } from "@/src/constants/narrative/types";
import { useOnboardingNavigation } from "@/src/hooks/useOnboardingNavigation";
import { media } from "@/src/constants/media";

type Scene3to6NarrativeProps = {
  sceneNumber: Extract<SceneNumber, 3 | 4 | 5 | 6>;
  childArchetype: ChildArchetype;
  onComplete: () => void;
  backgroundImage?: ImageSourcePropType;
  /**
   * Provide a fully custom layout. Receives the full navigation state.
   * When supplied, the default Pressable wrapper and default UI are skipped.
   */
  renderContent?: (props: OnboardingStepContentProps) => React.ReactNode;
  /** Pass-through to NarrativeStepView for fine-grained style/render overrides. */
  viewProps?: Partial<NarrativeStepViewProps>;
};

function getParagraphs(sceneNumber: 3 | 4 | 5 | 6, archetype: ChildArchetype): string[] {
  switch (sceneNumber) {
    case 3:
      return SCENE_3_PARAGRAPHS[archetype];
    case 4:
      return SCENE_4_PARAGRAPHS[archetype];
    case 5:
      return SCENE_5_PARAGRAPHS;
    case 6:
      return SCENE_6_PARAGRAPHS;
  }
}

/** Scenes 3–6: selects the right paragraphs by scene number and archetype. */
export function Scene3to6Narrative({
  sceneNumber,
  childArchetype,
  onComplete,
  backgroundImage = media.narrative.sanctuaryBg,
  renderContent,
  viewProps,
}: Scene3to6NarrativeProps) {
  const paragraphs = getParagraphs(sceneNumber, childArchetype);

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
      backgroundImage={backgroundImage}
      renderContent={renderContent}
      {...viewProps}
    />
  );
}
