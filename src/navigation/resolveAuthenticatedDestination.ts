import type { Href } from "expo-router";

import { routes } from "@/src/navigation/routes";
import type { DeletionStatus } from "@/src/services/firebase/types";
import type { getSyncNarrativeNeeds } from "@/src/services/onboarding/narrativeOnboardingStorage";
import { getAuthInitPhase } from "@/src/state/authInitStore";

export type PendingAuthDeepLink = "finish-email" | "reset-password" | null;

export type AuthDestinationInput = {
  uid: string | null;
  emailVerified: boolean;
  sanctuaryInitialized: boolean;
  pathname: string;
  narrative: {
    ready: boolean;
    needsArchetype: boolean;
    needsBirthDate: boolean;
    needsNarrative: boolean;
  };
  syncNarrativeNeeds: ReturnType<typeof getSyncNarrativeNeeds>;
  celebration: { ready: boolean; hasCompleted: boolean };
  pendingAuthDeepLink?: PendingAuthDeepLink;
  /** Signed-out only: true after user taps key on Gate this session. */
  gateUnlockedThisSession?: boolean;
  deletionStatus?: DeletionStatus;
};

const AUTH_ENTRY_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/finish-email",
  "/verify-required",
  "/email-verified",
  "/deletion-pending",
]);

const SIGNED_OUT_AUTH_PATHS = new Set(["/signup", "/login", "/forgot-password"]);

const AUTH_ACTION_PATHS = new Set(["/finish-email", "/reset-password"]);

function pathEquals(pathname: string, route: Href): boolean {
  return pathname === route;
}

function isAuthEntryPath(pathname: string): boolean {
  return AUTH_ENTRY_PATHS.has(pathname);
}

function isAuthActionPath(pathname: string): boolean {
  return AUTH_ACTION_PATHS.has(pathname);
}

function isSignedOutAuthPath(pathname: string): boolean {
  return SIGNED_OUT_AUTH_PATHS.has(pathname);
}

/**
 * Single routing brain for boot, post-boot guard, and post-Enter navigation.
 * Returns null when the user should stay on the current screen.
 */
export function resolveAuthenticatedDestination(input: AuthDestinationInput): Href | null {
  const {
    uid,
    emailVerified,
    sanctuaryInitialized,
    pathname,
    narrative,
    syncNarrativeNeeds: sync,
    celebration,
    pendingAuthDeepLink = null,
    gateUnlockedThisSession = false,
    deletionStatus = "active",
  } = input;

  if (__DEV__ && pathname === "/archetype-map-fixture") {
    return null;
  }

  if (uid && emailVerified && !sanctuaryInitialized) {
    if (getAuthInitPhase() === "initializing") {
      return null;
    }

    if (!celebration.hasCompleted) {
      if (
        pathEquals(pathname, routes.verifyRequired) ||
        pathEquals(pathname, routes.emailVerified) ||
        pathEquals(pathname, routes.finishEmail)
      ) {
        return null;
      }
      return routes.emailVerified;
    }

    if (pathEquals(pathname, routes.emailVerified) || pathEquals(pathname, routes.sanctuary)) {
      return null;
    }
  }

  if (uid && emailVerified && !celebration.ready) {
    if (pathEquals(pathname, routes.verifyRequired) || pathEquals(pathname, routes.finishEmail)) {
      return routes.emailVerified;
    }
    if (pathEquals(pathname, routes.emailVerified)) {
      return null;
    }
    return null;
  }

  if (pendingAuthDeepLink === "finish-email") {
    return routes.finishEmail;
  }
  if (pendingAuthDeepLink === "reset-password") {
    return routes.resetPassword;
  }

  if (!uid) {
    if (isAuthActionPath(pathname)) {
      return null;
    }
    if (pathEquals(pathname, routes.verifyRequired)) {
      return gateUnlockedThisSession ? null : routes.gateEntry;
    }
    if (!gateUnlockedThisSession) {
      return pathEquals(pathname, routes.gateEntry) ? null : routes.gateEntry;
    }
    if (isSignedOutAuthPath(pathname)) {
      return null;
    }
    return routes.gateEntry;
  }

  if (!emailVerified) {
    if (isAuthActionPath(pathname)) {
      return null;
    }
    return pathEquals(pathname, routes.verifyRequired) ? null : routes.verifyRequired;
  }

  if (deletionStatus === "pending") {
    return pathEquals(pathname, routes.deletionPending) ? null : routes.deletionPending;
  }

  if (!celebration.hasCompleted) {
    if (pathEquals(pathname, routes.emailVerified)) {
      return null;
    }
    return routes.emailVerified;
  }

  const needsArchetype = sync?.needsArchetype ?? narrative.needsArchetype;
  const needsBirthDate = sync?.needsBirthDate ?? narrative.needsBirthDate;
  const needsNarrative = sync?.needsNarrative ?? narrative.needsNarrative;
  const narrativeReady = narrative.ready || sync != null;

  if (!narrativeReady) {
    return null;
  }

  if (needsArchetype || needsBirthDate || needsNarrative) {
    return pathEquals(pathname, routes.narrativeOnboarding) ? null : routes.narrativeOnboarding;
  }

  const shouldLeaveAuthOrNarrative =
    isAuthEntryPath(pathname) || pathEquals(pathname, routes.narrativeOnboarding);

  if (shouldLeaveAuthOrNarrative) {
    return routes.sanctuary;
  }

  return null;
}
