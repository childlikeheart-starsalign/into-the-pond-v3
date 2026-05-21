import React, { useCallback } from "react";
import { View } from "react-native";

import { useNarrativeOnboarding } from "@/src/hooks/useNarrativeOnboarding";
import { ArchetypeSelector } from "./ArchetypeSelector";
import { OnboardingFlowCoordinator } from "./OnboardingFlowCoordinator";

type NarrativeOnboardingScreenProps = {
  /** Called after Day 1 narrative completes (e.g. navigate to sanctuary). */
  onComplete: () => void;
};

/**
 * Thin container that wires useNarrativeOnboarding into the presentation layer.
 *
 * Render order:
 *   1. ArchetypeSelector — if no archetype has been chosen yet
 *   2. OnboardingFlowCoordinator — routes through Scenes 1–6
 */
export function NarrativeOnboardingScreen({ onComplete }: NarrativeOnboardingScreenProps) {
  const { ready, needsArchetype, state, selectArchetype, setCurrentScene, completeNarrative } =
    useNarrativeOnboarding();

  const handleComplete = useCallback(async () => {
    await completeNarrative();
    onComplete();
  }, [completeNarrative, onComplete]);

  if (!ready) {
    // The route-level guard in _layout.tsx already gates on auth; here we just
    // return nothing while the async load resolves (usually < 50 ms).
    return <View style={{ flex: 1 }} />;
  }

  if (needsArchetype) {
    return (
      <View style={{ flex: 1 }}>
        <ArchetypeSelector onSelect={selectArchetype} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <OnboardingFlowCoordinator
        childArchetype={state.childArchetype!}
        onComplete={handleComplete}
        initialScene={state.currentScene}
        setCurrentScenePersist={setCurrentScene}
      />
    </View>
  );
}
