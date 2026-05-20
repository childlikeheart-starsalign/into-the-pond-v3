import { media } from "@/src/constants/media";

export type SceneId = "scene1" | "scene2" | "scene3";

export type SceneContent = {
  id: SceneId;
  title: string;
  body: string;
  ctaLabel: string;
  backgroundImage: number | null;
};

export const SCENES: Record<SceneId, SceneContent> = {
  scene1: {
    id: "scene1",
    title: "Into the Pond",
    body: "Every ripple begins with one small stone. Step gently — the water is ready for you.",
    ctaLabel: "Step in",
    backgroundImage: media.narrative.sanctuaryBg,
  },
  scene2: {
    id: "scene2",
    title: "The Quiet Garden",
    body: "A place to grow slowly. One habit, one breath, one wonder at a time.",
    ctaLabel: "Continue",
    backgroundImage: media.narrative.sanctuaryResting,
  },
  scene3: {
    id: "scene3",
    title: "The Well",
    body: "Questions are seeds. Drop one in and see what rises.",
    ctaLabel: "Begin",
    backgroundImage: media.narrative.sanctuaryTired,
  },
};

export const SCENE_ORDER: SceneId[] = ["scene1", "scene2", "scene3"];
