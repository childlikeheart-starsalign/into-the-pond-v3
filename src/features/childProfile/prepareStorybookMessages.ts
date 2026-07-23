import { FirebaseError } from "firebase/app";

import { isChildLimitReachedError } from "@/src/features/childProfile/childLimitReached";

/** Backend-facing prepare error codes — never pass these to UI components. */
export type PrepareBackendErrorCode = "CHILD_LIMIT_REACHED" | "NETWORK_ERROR" | "UNKNOWN";

export type StorybookMessageId = "limitReached" | "connectionLost" | "unexpected" | "pageUnwritten";

export type StorybookIllustrationKey = "closedJournal" | "foggyPath" | "spiritGuide";

export type StorybookMessage = {
  id: StorybookMessageId;
  illustrationKey: StorybookIllustrationKey;
  illustrationAccessibilityLabel: string;
  headline: string;
  /** Primary explanatory sentence — rendered at 22px. */
  lead: string;
  /** Detail / reassurance paragraphs — rendered at 18px. */
  supportingCopy: string[];
  primaryCta: string;
  secondaryCta?: string;
  allowRetry: boolean;
};

export const StorybookMessage = {
  limitReached: {
    id: "limitReached",
    illustrationKey: "spiritGuide",
    illustrationAccessibilityLabel: "Old spirit quietly smiling",
    headline: "This chapter is already written.",
    lead: "It looks like you've already prepared a child in this Sanctuary.",
    supportingCopy: [
      "To protect your journal, we only create one child profile at a time.",
      "You can continue with your existing child or manage your Sanctuary.",
    ],
    primaryCta: "Continue to My Sanctuary",
    secondaryCta: "Manage Children",
    allowRetry: false,
  },
  connectionLost: {
    id: "connectionLost",
    illustrationKey: "foggyPath",
    illustrationAccessibilityLabel: "Lantern beside a journal",
    headline: "The path is a little foggy right now.",
    lead: "We couldn't quite reach your Sanctuary just now.",
    supportingCopy: ["This usually clears on its own — take a breath, and try again in a moment."],
    primaryCta: "Try Again",
    allowRetry: true,
  },
  unexpected: {
    id: "unexpected",
    illustrationKey: "spiritGuide",
    illustrationAccessibilityLabel: "Old spirit quietly smiling",
    headline: "This page hasn't been written yet.",
    lead: "Something unexpected happened while we were preparing this chapter.",
    supportingCopy: ["Nothing has been lost — let's find our way back together."],
    primaryCta: "Continue to My Sanctuary",
    allowRetry: false,
  },
  pageUnwritten: {
    id: "pageUnwritten",
    illustrationKey: "spiritGuide",
    illustrationAccessibilityLabel: "Old spirit quietly smiling",
    headline: "This page hasn't been written yet.",
    lead: "This child's story hasn't shown an archetype pattern yet.",
    supportingCopy: ["When a Quick Check or Deep Check is complete, their page will open here."],
    primaryCta: "Back to the list",
    secondaryCta: "Begin Quick Check",
    allowRetry: false,
  },
} as const satisfies Record<StorybookMessageId, StorybookMessage>;

const NETWORK_ERROR_CODES = new Set([
  "unavailable",
  "functions/unavailable",
  "auth/network-request-failed",
  "deadline-exceeded",
  "functions/deadline-exceeded",
]);

export function isPrepareNetworkError(err: unknown): boolean {
  if (err instanceof FirebaseError) {
    return NETWORK_ERROR_CODES.has(err.code);
  }
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("offline") ||
      message.includes("failed to fetch")
    );
  }
  return false;
}

export function classifyPrepareError(err: unknown): PrepareBackendErrorCode {
  if (isChildLimitReachedError(err)) return "CHILD_LIMIT_REACHED";
  if (isPrepareNetworkError(err)) return "NETWORK_ERROR";
  return "UNKNOWN";
}

const PREPARE_ERROR_TO_STORYBOOK: Record<PrepareBackendErrorCode, StorybookMessage> = {
  CHILD_LIMIT_REACHED: StorybookMessage.limitReached,
  NETWORK_ERROR: StorybookMessage.connectionLost,
  UNKNOWN: StorybookMessage.unexpected,
};

/** Map any thrown prepare error to a StorybookMessage — unmapped codes never reach UI. */
export function mapPrepareErrorToStorybookMessage(err: unknown): StorybookMessage {
  return PREPARE_ERROR_TO_STORYBOOK[classifyPrepareError(err)];
}

/** Full screen-reader announcement: headline + every body paragraph, plain language only. */
export function buildStorybookAccessibilityLabel(message: StorybookMessage): string {
  return [message.headline, message.lead, ...message.supportingCopy].join(" ");
}

/** Collects every user-visible string on a message for regression tests. */
export function collectStorybookMessageStrings(message: StorybookMessage): string[] {
  return [
    message.headline,
    message.lead,
    ...message.supportingCopy,
    message.primaryCta,
    message.secondaryCta ?? "",
    message.illustrationAccessibilityLabel,
  ].filter(Boolean);
}
