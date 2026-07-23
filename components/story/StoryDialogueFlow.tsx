import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { StoryDialogueScene } from "@/components/story/StoryDialogueScene";
import { colors, fontFamilies } from "@/src/constants/theme";
import { getDialogueScene, type DialogueDynamicField } from "@/src/data/dialogues";

type StoryDialogueFlowProps = {
  sceneIds: readonly string[];
  onComplete: () => void;
  dynamicFieldValues?: Partial<Record<DialogueDynamicField, string>>;
  reducedMotion?: boolean;
};

function getLastLineIndex(sceneId: string): number {
  const scene = getDialogueScene(sceneId);
  if (!scene) return 0;
  if (typeof scene.lastLineIndex === "number") {
    return Math.min(scene.lastLineIndex, scene.lines.length - 1);
  }
  return scene.lines.length - 1;
}

/** Advances through dialogue lines and scenes using StoryDialogueScreen layout. */
export function StoryDialogueFlow({
  sceneIds,
  onComplete,
  dynamicFieldValues,
  reducedMotion,
}: StoryDialogueFlowProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);

  const sceneId = sceneIds[sceneIndex];
  const lastLineIndex = useMemo(() => getLastLineIndex(sceneId), [sceneId]);

  const handleAdvance = useCallback(() => {
    if (lineIndex < lastLineIndex) {
      setLineIndex((i) => i + 1);
      return;
    }

    if (sceneIndex < sceneIds.length - 1) {
      setSceneIndex((i) => i + 1);
      setLineIndex(0);
      return;
    }

    onComplete();
  }, [lineIndex, lastLineIndex, sceneIndex, sceneIds.length, onComplete]);

  if (!sceneId) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.missing}>Missing dialogue flow</Text>
      </View>
    );
  }

  return (
    <StoryDialogueScene
      sceneId={sceneId}
      lineIndex={lineIndex}
      onAdvance={handleAdvance}
      dynamicFieldValues={dynamicFieldValues}
      reducedMotion={reducedMotion}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  missing: {
    fontFamily: fontFamilies.body,
    color: colors.textSecondary,
  },
});
