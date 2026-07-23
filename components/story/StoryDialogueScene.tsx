import { useMemo } from "react";

import {
  StoryDialogueScreen,
  type StoryDialoguePage,
} from "@/components/story/StoryDialogueScreen";
import { dialogueSpeakerLabel } from "@/src/constants/dialogueSpeakerLabels";
import {
  resolveStoryBackground,
  resolveStoryPortrait,
  STORY_BACKGROUNDS,
} from "@/src/constants/storyAssets";
import {
  applyDialogueDynamicFields,
  getDialogueScene,
  type DialogueDynamicField,
} from "@/src/data/dialogues";

type StoryDialogueSceneProps = {
  sceneId: string;
  lineIndex?: number;
  onAdvance: () => void;
  dynamicFieldValues?: Partial<Record<DialogueDynamicField, string>>;
  reducedMotion?: boolean;
  /** Override speaker label; omit for narration-style lines. */
  speaker?: string;
};

function buildStoryPage(
  sceneId: string,
  lineIndex: number,
  dynamicFieldValues?: Partial<Record<DialogueDynamicField, string>>,
  speakerOverride?: string,
): StoryDialoguePage | null {
  const scene = getDialogueScene(sceneId);
  const line = scene?.lines[lineIndex];
  if (!scene || !line) return null;

  const background = resolveStoryBackground(scene.backgroundKey) ?? STORY_BACKGROUNDS.sanctuary;

  const speaker =
    speakerOverride !== undefined ? speakerOverride : dialogueSpeakerLabel(line.speaker);

  return {
    background,
    portrait: resolveStoryPortrait(line.portrait),
    speaker,
    dialogue: applyDialogueDynamicFields(line.text, dynamicFieldValues ?? {}),
  };
}

/** Data-driven adapter from dialogue scenes to StoryDialogueScreen. */
export function StoryDialogueScene({
  sceneId,
  lineIndex = 0,
  onAdvance,
  dynamicFieldValues,
  reducedMotion,
  speaker,
}: StoryDialogueSceneProps) {
  const page = useMemo(
    () => buildStoryPage(sceneId, lineIndex, dynamicFieldValues, speaker),
    [sceneId, lineIndex, dynamicFieldValues, speaker],
  );

  if (!page) {
    return null;
  }

  return <StoryDialogueScreen page={page} onAdvance={onAdvance} reducedMotion={reducedMotion} />;
}

export { buildStoryPage };
