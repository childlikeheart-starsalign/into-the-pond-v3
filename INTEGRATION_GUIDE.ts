/**
 * Tutorial Integration Guide
 *
 * 1) Mount TutorialManager once near your root screen container.
 *
 *    import { TutorialManager } from "@/src/components/tutorial/TutorialManager";
 *
 *    export default function SanctuaryScreen() {
 *      return (
 *        <>
 *          <YourScreenContent />
 *          <TutorialManager />
 *        </>
 *      );
 *    }
 *
 * 2) Keep it mounted on the route where onboarding tips should appear.
 *    - The hook auto-persists state in AsyncStorage.
 *    - Day is computed from first run timestamp.
 *    - Sequence runs up to day 7.
 *
 * 3) Optional: reset from any dev/debug button.
 *
 *    import { useTutorial } from "@/src/hooks/useTutorial";
 *
 *    function DebugResetTutorialButton() {
 *      const { resetTutorial } = useTutorial();
 *      return <Button title="Reset Tutorial" onPress={resetTutorial} />;
 *    }
 */

export const tutorialIntegrationGuideVersion = "v1";
