import { isDisplayArchetypeName } from "@/shared/childProfile/archetypeQuickCheck";

export type ChildCheckCta = {
  kind: "quick_check" | "deep_check";
  label: string;
};

/**
 * Switcher peek/unwritten secondary CTA from Quick Check completion signal.
 * Known displayArchetypeName → Deep Check; otherwise → Quick Check.
 */
export function resolveChildCheckCta(
  displayArchetypeName: string | null | undefined,
): ChildCheckCta {
  if (isDisplayArchetypeName(displayArchetypeName)) {
    return { kind: "deep_check", label: "Begin Deep Check" };
  }
  return { kind: "quick_check", label: "Begin Quick Check" };
}
