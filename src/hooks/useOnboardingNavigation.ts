import { useCallback, useState } from "react";

export type UseOnboardingNavigationOptions = {
  paragraphs: string[];
  onComplete: () => void;
};

export type UseOnboardingNavigationReturn = {
  /** 0-based index of the currently displayed paragraph. */
  currentStep: number;
  totalSteps: number;
  currentParagraph: string;
  isFirstStep: boolean;
  isLastStep: boolean;
  /** Advance to next paragraph. Fires onComplete when already on the last. */
  goToNext: () => void;
  /** Go back one paragraph. No-op when already on the first. */
  goToPrevious: () => void;
  /** Skip straight to completion without stepping through remaining paragraphs. */
  completeOnboarding: () => void;
};

/**
 * Pure navigation logic for a single narrative scene (paragraph-by-paragraph).
 * No styling, no animations — those belong in NarrativeStepView or renderContent.
 */
export function useOnboardingNavigation({
  paragraphs,
  onComplete,
}: UseOnboardingNavigationOptions): UseOnboardingNavigationReturn {
  const [currentStep, setCurrentStep] = useState(0);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === paragraphs.length - 1;

  const goToNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const goToPrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const completeOnboarding = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return {
    currentStep,
    totalSteps: paragraphs.length,
    currentParagraph: paragraphs[currentStep] ?? "",
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrevious,
    completeOnboarding,
  };
}
