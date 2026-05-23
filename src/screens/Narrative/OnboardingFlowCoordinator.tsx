import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, View } from "react-native";

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

const CROSSFADE_MS = 350;

type CrossFadeSceneProps = {
  sceneKey: string;
  children: React.ReactNode;
};

/** Cross-fades between narrative scenes while keeping the outgoing scene visible briefly. */
function CrossFadeScene({ sceneKey, children }: CrossFadeSceneProps) {
  const latestRef = useRef({ key: sceneKey, node: children });
  latestRef.current = { key: sceneKey, node: children };

  const [active, setActive] = useState(latestRef.current);
  const activeStateRef = useRef(active);
  activeStateRef.current = active;

  const [previous, setPrevious] = useState<React.ReactNode | null>(null);
  const activeOpacity = useRef(new Animated.Value(1)).current;
  const previousOpacity = useRef(new Animated.Value(0)).current;
  const lastAnimatedKey = useRef(sceneKey);

  useEffect(() => {
    const next = latestRef.current;

    if (sceneKey === lastAnimatedKey.current) {
      setActive(next);
      return;
    }

    setPrevious(activeStateRef.current.node);
    setActive(next);
    lastAnimatedKey.current = sceneKey;
    activeOpacity.setValue(0);
    previousOpacity.setValue(1);

    const animation = Animated.parallel([
      Animated.timing(previousOpacity, {
        toValue: 0,
        duration: CROSSFADE_MS,
        useNativeDriver: true,
      }),
      Animated.timing(activeOpacity, {
        toValue: 1,
        duration: CROSSFADE_MS,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) setPrevious(null);
    });

    return () => animation.stop();
  }, [sceneKey, activeOpacity, previousOpacity]);

  return (
    <View style={styles.crossFadeRoot}>
      {previous != null ? (
        <Animated.View
          style={[styles.sceneLayer, { opacity: previousOpacity }]}
          pointerEvents="none"
        >
          {previous}
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.sceneLayer, { opacity: activeOpacity }]}>
        {active.node}
      </Animated.View>
    </View>
  );
}

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

  const sceneKey = phase === "branch" ? `branch-${branchIndex}` : `shared-${currentScene}`;
  const hasBranchAfterShared = branchScenes.length > 0;
  const isLastScene =
    phase === "branch"
      ? branchIndex === branchScenes.length - 1
      : currentScene === 6 && !hasBranchAfterShared;

  const sceneNode =
    phase === "branch" ? (
      <NarrativeVideoScene
        source={branchScenes[branchIndex]}
        onComplete={handleBranchSceneComplete}
        isLastScene={isLastScene}
        tapOnly
      />
    ) : (
      <NarrativeVideoScene
        source={media.narrative.scenes[currentScene]}
        onComplete={handleSharedSceneComplete}
        isLastScene={isLastScene}
      />
    );

  if (completing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CrossFadeScene sceneKey={sceneKey}>{sceneNode}</CrossFadeScene>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  crossFadeRoot: {
    flex: 1,
  },
  sceneLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
