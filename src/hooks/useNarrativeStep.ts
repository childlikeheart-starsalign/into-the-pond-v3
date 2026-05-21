/**
 * @deprecated Use useOnboardingNavigation for new code.
 * This shim maps the old `advance / currentIndex` API to the new hook.
 */
import { useCallback } from "react";

import { useOnboardingNavigation, UseOnboardingNavigationOptions } from "./useOnboardingNavigation";

export type UseNarrativeStepOptions = UseOnboardingNavigationOptions;

export type UseNarrativeStepReturn = {
  currentIndex: number;
  currentParagraph: string;
  totalParagraphs: number;
  isLast: boolean;
  advance: () => void;
};

export function useNarrativeStep({
  paragraphs,
  onComplete,
}: UseNarrativeStepOptions): UseNarrativeStepReturn {
  const nav = useOnboardingNavigation({ paragraphs, onComplete });

  const advance = useCallback(() => nav.goToNext(), [nav]);

  return {
    currentIndex: nav.currentStep,
    currentParagraph: nav.currentParagraph,
    totalParagraphs: nav.totalSteps,
    isLast: nav.isLastStep,
    advance,
  };
}
