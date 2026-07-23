import { Redirect } from "expo-router";

import { routes } from "@/src/navigation/routes";

/**
 * Legacy emoji archetype route — superseded by narrative onboarding ArchetypeSelector.
 * Keep file so deep links don't 404; send users to the live flow.
 */
export default function ArchetypeSelectorRoute() {
  return <Redirect href={routes.narrativeOnboarding} />;
}
