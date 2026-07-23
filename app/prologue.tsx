import { router } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { StoryDialogueFlow } from "@/components/story/StoryDialogueFlow";
import { colors } from "@/src/constants/theme";
import { PRE_AUTH_PROLOGUE_SCENE_IDS } from "@/src/data/dialogues";
import { useAuthBoot } from "@/src/hooks/useAuthBoot";
import { routes } from "@/src/navigation/routes";
import { markPreAuthPrologueComplete } from "@/src/services/onboarding/narrativeOnboardingStorage";

/** Part 1 — signed-out dialogue prologue → signup. */
export default function PrologueScreen() {
  const { unlockGateForSession } = useAuthBoot();

  const handleComplete = useCallback(async () => {
    await markPreAuthPrologueComplete();
    unlockGateForSession();
    router.replace(routes.signup);
  }, [unlockGateForSession]);

  return (
    <View style={styles.fill}>
      <StoryDialogueFlow
        sceneIds={PRE_AUTH_PROLOGUE_SCENE_IDS}
        onComplete={() => void handleComplete()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
