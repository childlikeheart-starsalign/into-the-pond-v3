import { useCallback, useState } from "react";

import { SCENE_ORDER, SCENES, SceneId } from "@/src/constants/narrative";

type UseScene1LogicProps = {
  onComplete: () => void;
  onSkip?: () => void;
};

export function useScene1Logic({ onComplete, onSkip }: UseScene1LogicProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentId: SceneId = SCENE_ORDER[currentIndex];
  const currentScene = SCENES[currentId];
  const totalScenes = SCENE_ORDER.length;
  const isLastScene = currentIndex === totalScenes - 1;

  const advance = useCallback(() => {
    if (isLastScene) {
      onComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLastScene, onComplete]);

  const skip = useCallback(() => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  }, [onComplete, onSkip]);

  return {
    currentScene,
    currentIndex,
    totalScenes,
    isLastScene,
    advance,
    skip,
  };
}
