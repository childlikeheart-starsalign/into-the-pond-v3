import assert from "node:assert/strict";
import test from "node:test";

import { FirebaseError } from "firebase/app";

import { ChildLimitReachedError } from "./childLimitReached";
import {
  StorybookMessage,
  buildStorybookAccessibilityLabel,
  classifyPrepareError,
  collectStorybookMessageStrings,
  mapPrepareErrorToStorybookMessage,
  type PrepareBackendErrorCode,
  type StorybookMessageId,
} from "./prepareStorybookMessages";

const BACKEND_CODES: PrepareBackendErrorCode[] = [
  "CHILD_LIMIT_REACHED",
  "NETWORK_ERROR",
  "UNKNOWN",
];

const EXPECTED_MESSAGE_ID: Record<PrepareBackendErrorCode, StorybookMessageId> = {
  CHILD_LIMIT_REACHED: "limitReached",
  NETWORK_ERROR: "connectionLost",
  UNKNOWN: "unexpected",
};

test("each backend code maps to the correct StorybookMessage id", () => {
  for (const code of BACKEND_CODES) {
    const err =
      code === "CHILD_LIMIT_REACHED"
        ? new ChildLimitReachedError()
        : code === "NETWORK_ERROR"
          ? new FirebaseError("functions/unavailable", "offline")
          : new Error("something else");
    assert.equal(classifyPrepareError(err), code);
    assert.equal(mapPrepareErrorToStorybookMessage(err).id, EXPECTED_MESSAGE_ID[code]);
  }
});

test("unmapped raw enum string falls through to unexpected", () => {
  const message = mapPrepareErrorToStorybookMessage(new Error("PROFILE_ALREADY_EXISTS"));
  assert.equal(message.id, "unexpected");
});

test("allowRetry is false for every message except connectionLost", () => {
  assert.equal(StorybookMessage.limitReached.allowRetry, false);
  assert.equal(StorybookMessage.unexpected.allowRetry, false);
  assert.equal(StorybookMessage.connectionLost.allowRetry, true);
});

test("pageUnwritten secondary CTA invites Quick Check", () => {
  assert.equal(StorybookMessage.pageUnwritten.secondaryCta, "Begin Quick Check");
});

test("no raw backend enum string appears in StorybookMessage copy", () => {
  const forbidden = [
    "CHILD_LIMIT_REACHED",
    "PROFILE_ALREADY_EXISTS",
    "ALREADY_LOCKED",
    "NETWORK_ERROR",
    "UNKNOWN",
  ];

  for (const message of Object.values(StorybookMessage)) {
    const blob = collectStorybookMessageStrings(message).join(" ");
    for (const code of forbidden) {
      assert.equal(
        blob.includes(code),
        false,
        `StorybookMessage.${message.id} must not include raw code ${code}`,
      );
    }
  }
});

test("mapped messages never leak backend codes into user-facing strings", () => {
  const samples: unknown[] = [
    new ChildLimitReachedError(),
    new FirebaseError("auth/network-request-failed", "network"),
    new Error("CHILD_LIMIT_REACHED"),
    new Error("totally unknown"),
  ];

  for (const err of samples) {
    const message = mapPrepareErrorToStorybookMessage(err);
    const blob = collectStorybookMessageStrings(message).join(" ");
    for (const code of BACKEND_CODES) {
      assert.equal(blob.includes(code), false);
    }
  }
});

test("screen reader label includes full headline, lead, and every supporting paragraph", () => {
  for (const message of Object.values(StorybookMessage)) {
    const label = buildStorybookAccessibilityLabel(message);
    assert.ok(label.includes(message.headline));
    assert.ok(label.includes(message.lead));
    for (const paragraph of message.supportingCopy) {
      assert.ok(label.includes(paragraph));
    }
  }
});
