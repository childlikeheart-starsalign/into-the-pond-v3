import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { get, ref, set } from "firebase/database";

const PROJECT_ID = "into-the-pond-rtdb-rules-test";
const RULES_PATH = resolve(__dirname, "..", "database.rules.json");
const PARENT_UID = "parent_uid";
const CHILD_UID = "child_uid";
const OTHER_UID = "other_uid";
const SESSION_ID = "sess_test";

let testEnv: RulesTestEnvironment;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: {
      rules: readFileSync(RULES_PATH, "utf8"),
    },
  });
});

test.after(async () => {
  await testEnv?.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearDatabase();
});

function parentDb() {
  return testEnv.authenticatedContext(PARENT_UID).database();
}

function childDb() {
  return testEnv.authenticatedContext(CHILD_UID).database();
}

function otherDb() {
  return testEnv.authenticatedContext(OTHER_UID).database();
}

function unauthenticatedDb() {
  return testEnv.unauthenticatedContext().database();
}

function validSession(creatorUid: string, extraMemberUid?: string) {
  const now = Date.now();
  const members: Record<string, { role: string; addedAt: number }> = {
    [creatorUid]: { role: "parent", addedAt: now },
  };
  if (extraMemberUid) {
    members[extraMemberUid] = { role: "child", addedAt: now };
  }
  return {
    createdBy: creatorUid,
    expiresAt: now + 3_600_000,
    members,
  };
}

async function seedSession(creatorUid: string, extraMemberUid?: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(
      ref(context.database(), `sessions/${SESSION_ID}`),
      validSession(creatorUid, extraMemberUid),
    );
  });
}

test("denies non-member read session", async () => {
  await seedSession(PARENT_UID, CHILD_UID);
  await assertFails(get(ref(otherDb(), `sessions/${SESSION_ID}`)));
});

test("denies non-member write session", async () => {
  await seedSession(PARENT_UID);
  await assertFails(
    set(ref(otherDb(), `sessions/${SESSION_ID}/members/${OTHER_UID}`), {
      role: "invited",
      addedAt: Date.now(),
    }),
  );
});

test("allows creator atomic create with self in members", async () => {
  const session = validSession(PARENT_UID, CHILD_UID);
  await assertSucceeds(set(ref(parentDb(), `sessions/${SESSION_ID}`), session));
});

test("denies multi-step create without members in initial write", async () => {
  const now = Date.now();
  await assertFails(
    set(ref(parentDb(), `sessions/${SESSION_ID}`), {
      createdBy: PARENT_UID,
      expiresAt: now + 3_600_000,
    }),
  );
});

test("allows member adding invited uid under members", async () => {
  await seedSession(PARENT_UID);
  await assertSucceeds(
    set(ref(parentDb(), `sessions/${SESSION_ID}/members/${CHILD_UID}`), {
      role: "child",
      addedAt: Date.now(),
    }),
  );
});

test("denies non-member write under members", async () => {
  await seedSession(PARENT_UID);
  await assertFails(
    set(ref(otherDb(), `sessions/${SESSION_ID}/members/${OTHER_UID}`), {
      role: "invited",
      addedAt: Date.now(),
    }),
  );
});

test("allows self-only session presence write", async () => {
  await seedSession(PARENT_UID, CHILD_UID);
  await assertSucceeds(
    set(ref(parentDb(), `sessions/${SESSION_ID}/presence/${PARENT_UID}`), {
      state: "joined",
      ts: Date.now(),
    }),
  );
});

test("denies writing another uid session presence", async () => {
  await seedSession(PARENT_UID, CHILD_UID);
  await assertFails(
    set(ref(parentDb(), `sessions/${SESSION_ID}/presence/${CHILD_UID}`), {
      state: "joined",
      ts: Date.now(),
    }),
  );
});

test("denies changing createdBy on existing session", async () => {
  await seedSession(PARENT_UID);
  await assertFails(set(ref(parentDb(), `sessions/${SESSION_ID}/createdBy`), OTHER_UID));
});

test("denies expiresAt in the past on create", async () => {
  const now = Date.now();
  await assertFails(
    set(ref(parentDb(), `sessions/sess_past`), {
      createdBy: PARENT_UID,
      expiresAt: now - 1,
      members: {
        [PARENT_UID]: { role: "parent", addedAt: now },
      },
    }),
  );
});

test("denies unknown subpath under session", async () => {
  await seedSession(PARENT_UID);
  await assertFails(set(ref(parentDb(), `sessions/${SESSION_ID}/evilField`), "x"));
});

test("allows top-level presence with valid shape", async () => {
  await assertSucceeds(
    set(ref(parentDb(), `presence/${PARENT_UID}`), {
      state: "online",
      lastSeen: Date.now(),
    }),
  );
});

test("denies top-level presence with invalid shape", async () => {
  await assertFails(
    set(ref(parentDb(), `presence/${PARENT_UID}`), {
      online: true,
      lastSeen: Date.now(),
    }),
  );
});

test("allows member read session", async () => {
  await seedSession(PARENT_UID, CHILD_UID);
  await assertSucceeds(get(ref(childDb(), `sessions/${SESSION_ID}`)));
});

test("allows ritual event with matching authorUid", async () => {
  await seedSession(PARENT_UID);
  await assertSucceeds(
    set(ref(parentDb(), `sessions/${SESSION_ID}/ritual/event1`), {
      type: "well_question_asked",
      authorUid: PARENT_UID,
      ts: Date.now(),
    }),
  );
});

test("denies ritual event with forged authorUid", async () => {
  await seedSession(PARENT_UID);
  await assertFails(
    set(ref(parentDb(), `sessions/${SESSION_ID}/ritual/event1`), {
      type: "well_question_asked",
      authorUid: OTHER_UID,
      ts: Date.now(),
    }),
  );
});

test("allows authenticated owner _dev ping", async () => {
  await assertSucceeds(
    set(ref(parentDb(), `_dev/${PARENT_UID}/ping`), { ok: true, at: Date.now() }),
  );
});

test("denies unauthenticated _dev write", async () => {
  await assertFails(set(ref(unauthenticatedDb(), `_dev/${PARENT_UID}/ping`), { ok: true }));
});

assert.ok(RULES_PATH);
