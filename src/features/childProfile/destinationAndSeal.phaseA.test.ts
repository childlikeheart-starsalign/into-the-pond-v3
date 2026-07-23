import assert from "node:assert/strict";
import test from "node:test";

import { resolveAuthenticatedDestination } from "../../navigation/resolveAuthenticatedDestination";
import type { AuthDestinationInput } from "../../navigation/resolveAuthenticatedDestination";
import { resolveGateAddChildMode } from "../gate/components/resolveGateAddChildMode";
import { ChildLimitReachedError } from "./childLimitReached";

/** Minimal route stubs — avoid importing expo-router-backed routes.ts in node tests. */
const ROUTES = {
  narrativeOnboarding: "/narrative-onboarding",
  createChildProfile: "/create-child-profile",
  sanctuary: "/sanctuary",
} as const;

function baseInput(overrides: Partial<AuthDestinationInput> = {}): AuthDestinationInput {
  return {
    uid: "user-1",
    emailVerified: true,
    sanctuaryInitialized: true,
    pathname: "/sanctuary",
    narrative: {
      ready: true,
      needsArchetype: true,
      needsBirthDate: false,
      needsNarrative: false,
    },
    syncNarrativeNeeds: null,
    celebration: { ready: true, hasCompleted: true },
    pendingAuthDeepLink: null,
    gateUnlockedThisSession: false,
    ...overrides,
  };
}

test("Flag B off: needs archetype still routes to narrative (legacy)", () => {
  const dest = resolveAuthenticatedDestination(
    baseInput({
      childProfile: { flagEnabled: false, ready: true, needsCreate: true },
    }),
  );
  assert.equal(String(dest), ROUTES.narrativeOnboarding);
});

test("Flag B on + needsCreate: routes to create-child-profile before narrative", () => {
  const dest = resolveAuthenticatedDestination(
    baseInput({
      childProfile: { flagEnabled: true, ready: true, needsCreate: true },
    }),
  );
  assert.equal(String(dest), ROUTES.createChildProfile);
});

test("Flag B on + child exists: narrative still wins when needed", () => {
  const dest = resolveAuthenticatedDestination(
    baseInput({
      childProfile: { flagEnabled: true, ready: true, needsCreate: false },
    }),
  );
  assert.equal(String(dest), ROUTES.narrativeOnboarding);
});

test("CHILD_LIMIT_REACHED client contract is distinct from success", () => {
  const err = new ChildLimitReachedError();
  assert.equal(err.code, "CHILD_LIMIT_REACHED");
  assert.notEqual(err.code, "ok");
});

test("Free Gate card is invite_upgrade — never add_child (no empty slot write)", () => {
  const mode = resolveGateAddChildMode({
    flagEnabled: true,
    childCount: 1,
    hasPaidRod: false,
    subscription: { subscriptionStatus: "free", isLifetime: false },
  });
  assert.equal(mode.kind, "invite_upgrade");
});
