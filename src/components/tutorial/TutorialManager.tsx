import { OpeningSequence } from "@/src/components/tutorial/OpeningSequence";
import { TutorialTip } from "@/src/components/tutorial/TutorialTip";
import { useTutorial } from "@/src/hooks/useTutorial";

export function TutorialManager() {
  const {
    ready,
    currentTip,
    shouldShowOpeningSequence,
    shouldShowDailyTip,
    completeOpeningSequence,
    dismissTodayTip,
  } = useTutorial();

  if (!ready) return null;

  return (
    <>
      {shouldShowOpeningSequence ? <OpeningSequence onContinue={completeOpeningSequence} /> : null}
      {shouldShowDailyTip ? (
        <TutorialTip
          title={currentTip.title}
          body={currentTip.body}
          ctaLabel={currentTip.ctaLabel}
          onDismiss={dismissTodayTip}
        />
      ) : null}
    </>
  );
}
