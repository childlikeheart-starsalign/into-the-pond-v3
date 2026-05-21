export type ChildArchetype = "storm" | "wall" | "spark";
export type SceneNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type NarrativeOnboardingState = {
  childArchetype: ChildArchetype | null;
  hasCompletedDay1Narrative: boolean;
  /** Scene to resume from (1–6). */
  currentScene: SceneNumber;
  startedAtIso: string | null;
  completedAtIso: string | null;
};
