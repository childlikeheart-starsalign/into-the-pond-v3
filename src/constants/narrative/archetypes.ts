import { ChildArchetype } from "./types";

export type ArchetypeOption = {
  id: ChildArchetype;
  label: string;
  description: string;
};

export const ARCHETYPE_OPTIONS: ArchetypeOption[] = [
  {
    id: "storm",
    label: "Big feelings, hard to calm",
    description:
      "Your child reacts intensely, has trouble regulating emotions, or melts down under stress.",
  },
  {
    id: "wall",
    label: "Quiet, hard to reach",
    description:
      "Your child withdraws, shuts down, or seems unreachable when things get difficult.",
  },
  {
    id: "spark",
    label: "Curious, tests boundaries",
    description: "Your child pushes back, questions rules, or always needs to know why.",
  },
];
