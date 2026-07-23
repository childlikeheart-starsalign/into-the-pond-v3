import assert from "node:assert/strict";
import test from "node:test";

import {
  CAST_READY_NOTIF_STORAGE_PREFIX,
  castIdsFromNotifStorageKeys,
  orphanedCastReadyCastIds,
} from "./castReadyNotificationLogic";

test("orphanedCastReadyCastIds cancels all when no active cast", () => {
  assert.deepEqual(orphanedCastReadyCastIds(["a", "b"], null), ["a", "b"]);
});

test("orphanedCastReadyCastIds keeps only the active castId", () => {
  assert.deepEqual(orphanedCastReadyCastIds(["old", "active", "stale"], "active"), [
    "old",
    "stale",
  ]);
});

test("orphanedCastReadyCastIds is empty when only active is registered", () => {
  assert.deepEqual(orphanedCastReadyCastIds(["active"], "active"), []);
});

test("castIdsFromNotifStorageKeys strips prefix", () => {
  assert.deepEqual(
    castIdsFromNotifStorageKeys([
      `${CAST_READY_NOTIF_STORAGE_PREFIX}cast_1`,
      "unrelated",
      `${CAST_READY_NOTIF_STORAGE_PREFIX}`,
    ]),
    ["cast_1"],
  );
});
