import { router } from "expo-router";

import { SanctuaryPreparationStep } from "@/src/components/dialogue/SanctuaryPreparationStep";
import { StorybookMessage } from "@/src/features/childProfile/prepareStorybookMessages";
import { routes } from "@/src/navigation/routes";

/**
 * Limit-reached storybook — only for avatar → Add child when free tier / at cap.
 * Not used by global auth routing or prologue prepare.
 */
export default function ChildProfileLimitScreen() {
  return (
    <SanctuaryPreparationStep
      status="error"
      message={StorybookMessage.limitReached}
      onPrimaryPress={() => {
        router.replace(routes.sanctuary);
      }}
      onSecondaryPress={() => {
        router.replace(routes.sanctuary);
      }}
    />
  );
}
