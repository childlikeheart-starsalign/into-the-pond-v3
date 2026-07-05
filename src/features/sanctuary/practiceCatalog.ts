import type { PracticeKind } from "@/src/domain/sanctuary";
import { PRACTICE_WONDER_BY_KIND } from "@/src/domain/sanctuary";

export type PracticeOption = {
  kind: PracticeKind;
  /** Emotional, recognizable — scannable in 1–2 seconds. */
  headline: string;
  /** Short relatable example; partial success counts. */
  moment: string;
  /** De-emphasized parenting skill vocabulary anchor. */
  skillNote: string;
};

export const PRACTICE_OPTIONS: PracticeOption[] = [
  {
    kind: "tried_validation",
    headline: "I named what they were feeling",
    moment: "Before fixing or teaching, I said what I noticed — even imperfectly.",
    skillNote: "A form of validation",
  },
  {
    kind: "stayed_calm_during_conflict",
    headline: "I stayed a little calmer than I expected",
    moment: "When things got loud or sharp, I slowed my body — even for a moment.",
    skillNote: "Staying calm during conflict",
  },
  {
    kind: "used_co_regulation",
    headline: "I helped us settle together",
    moment: "I matched their pace, tone, or breath — or stayed close while they settled.",
    skillNote: "Co-regulation",
  },
  {
    kind: "followed_child_lead",
    headline: "I followed their lead",
    moment: "I let curiosity or play guide the moment instead of my plan.",
    skillNote: "Following their lead",
  },
  {
    kind: "practiced_curiosity",
    headline: "I got curious instead of assuming",
    moment: "I asked a question and waited — even if the answer was messy.",
    skillNote: "Practicing curiosity",
  },
];

export function practiceWonderRange(kind: PracticeKind): { min: number; max: number } {
  const rule = PRACTICE_WONDER_BY_KIND[kind];
  return { min: rule.min, max: rule.max };
}
