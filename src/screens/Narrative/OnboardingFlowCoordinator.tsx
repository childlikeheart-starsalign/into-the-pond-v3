import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ChildArchetype, SceneNumber } from "@/src/constants/narrative/types";
import { media } from "@/src/constants/media";
import { NarrativeVideoScene } from "@/src/components/narrative";

type FlowPhase = "shared" | "branch";

type OnboardingFlowCoordinatorProps = {
  childArchetype: ChildArchetype;
  /** Called after the full narrative flow completes (shared + archetype branch). */
  onComplete: () => Promise<void>;
  /** Starting scene — supports resuming mid-flow. */
  initialScene?: SceneNumber;
  /** Persist current shared scene so the flow can resume after restart. */
  setCurrentScenePersist?: (scene: SceneNumber) => void;
};

/**
 * Routes through Day 1 narrative scenes in sequence:
 * Shared Scene 1 → … → Scene 6 → optional archetype branch → onComplete
 *
 * Persistence (AsyncStorage + Firestore) is handled by the caller via useNarrativeOnboarding.
 * This component is responsible only for scene routing and calling onComplete.
 */
export function OnboardingFlowCoordinator({
  childArchetype,
  onComplete,
  initialScene = 1,
  setCurrentScenePersist,
}: OnboardingFlowCoordinatorProps) {
  const [phase, setPhase] = useState<FlowPhase>("shared");
  const [currentScene, setCurrentScene] = useState<SceneNumber>(initialScene);
  const [branchIndex, setBranchIndex] = useState(0);
  const [completing, setCompleting] = useState(false);

  const branchScenes = useMemo(
    () => media.narrative.archetypeScenes[childArchetype],
    [childArchetype],
  );

  const finishOnboarding = useCallback(async () => {
    setCompleting(true);
    try {
      await onComplete();
    } finally {
      setCompleting(false);
    }
  }, [onComplete]);

  const advanceSharedScene = useCallback(() => {
    setCurrentScene((prev) => {
      if (prev < 6) {
        const next = (prev + 1) as SceneNumber;
        setCurrentScenePersist?.(next);
        return next;
      }
      return prev;
    });
  }, [setCurrentScenePersist]);

  const handleSharedSceneComplete = useCallback(() => {
    if (currentScene < 6) {
      advanceSharedScene();
      return;
    }

    if (branchScenes.length > 0) {
      setPhase("branch");
      setBranchIndex(0);
      return;
    }

    setCurrentScenePersist?.(6);
    void finishOnboarding();
  }, [currentScene, advanceSharedScene, branchScenes.length, finishOnboarding, setCurrentScenePersist]);

  const handleBranchSceneComplete = useCallback(() => {
    const nextIndex = branchIndex + 1;
    if (nextIndex < branchScenes.length) {
      setBranchIndex(nextIndex);
      return;
    }

    void finishOnboarding();
  }, [branchIndex, branchScenes.length, finishOnboarding]);

  if (completing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (phase === "branch") {
    const isLastBranchScene = branchIndex === branchScenes.length - 1;

    return (
      <View style={styles.container}>
        <NarrativeVideoScene
          key={`branch-${branchIndex}`}
          source={branchScenes[branchIndex]}
          onComplete={handleBranchSceneComplete}
          isLastScene={isLastBranchScene}
          tapOnly
        />
      </View>
    );
  }

  const hasBranchAfterShared = branchScenes.length > 0;
  const isLastSharedScene = currentScene === 6 && !hasBranchAfterShared;

  return (
    <View style={styles.container}>
      <NarrativeVideoScene
        key={currentScene}
        source={media.narrative.scenes[currentScene]}
        onComplete={handleSharedSceneComplete}
        isLastScene={isLastSharedScene}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
