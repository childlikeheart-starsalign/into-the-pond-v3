import React, { useCallback } from "react";
import { View } from "react-native";

import { useNarrativeOnboarding } from "@/src/hooks/useNarrativeOnboarding";
import { ArchetypeSelector } from "./ArchetypeSelector";
import { ChildBirthDateStep } from "./ChildBirthDateStep";
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
 *   2. ChildBirthDateStep — if archetype set but birth date missing
 *   3. OnboardingFlowCoordinator — routes through Scenes 1–6
 */
export function NarrativeOnboardingScreen({ onComplete }: NarrativeOnboardingScreenProps) {
  const {
    ready,
    needsArchetype,
    needsBirthDate,
    state,
    selectArchetype,
    setChildBirthDate,
    setCurrentScene,
    completeNarrative,
  } = useNarrativeOnboarding();

  const handleComplete = useCallback(async () => {
    await completeNarrative();
    onComplete();
  }, [completeNarrative, onComplete]);

  if (!ready) {
    return <View style={{ flex: 1 }} />;
  }

  if (needsArchetype) {
    return (
      <View style={{ flex: 1 }}>
        <ArchetypeSelector onSelect={selectArchetype} />
      </View>
    );
  }

  if (needsBirthDate) {
    return (
      <View style={{ flex: 1 }}>
        <ChildBirthDateStep onSubmit={setChildBirthDate} />
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
