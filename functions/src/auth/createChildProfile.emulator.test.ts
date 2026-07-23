/**
 * Emulator E2E for createChildProfile + compatibility boundary.
 * Requires FIRESTORE_EMULATOR_HOST (set by scripts/run-create-child-profile-emulator-test.mjs).
 */
import assert from "node:assert/strict";
import test, { before } from "node:test";

import { HttpsError } from "firebase-functions/v2/https";

const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT = process.env.GCLOUD_PROJECT ?? "into-the-pond-child-profile-emu";

if (!EMULATOR) {
  throw new Error(
    "FIRESTORE_EMULATOR_HOST is required. Run: npm run test:create-child-profile-emulator",
  );
}

process.env.GCLOUD_PROJECT = PROJECT;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT;
process.env.ACCOUNT_DELETION_SECRET =
  process.env.ACCOUNT_DELETION_SECRET ?? "test-account-deletion-secret";
process.env.FUNCTIONS_EMULATOR = "true";

type Db = typeof import("../init").db;
type CreateFn = typeof import("./createChildProfile").createChildProfileCallable;

let db: Db;
let createChildProfileCallable: CreateFn;
let CHILD_LIMIT_REACHED: string;
let backupAllChildrenSubtrees: typeof import("./childrenDeletionBackup").backupAllChildrenSubtrees;
let deleteAllChildrenSubtrees: typeof import("./childrenDeletionBackup").deleteAllChildrenSubtrees;
let restoreChildrenSubtrees: typeof import("./childrenDeletionBackup").restoreChildrenSubtrees;
let encryptRestorePayload: typeof import("./deletionCrypto").encryptRestorePayload;
let decryptRestorePayload: typeof import("./deletionCrypto").decryptRestorePayload;

before(async () => {
  ({ createChildProfileCallable, CHILD_LIMIT_REACHED } = await import("./createChildProfile"));
  ({ db } = await import("../init"));
  ({ backupAllChildrenSubtrees, deleteAllChildrenSubtrees, restoreChildrenSubtrees } =
    await import("./childrenDeletionBackup"));
  ({ encryptRestorePayload, decryptRestorePayload } = await import("./deletionCrypto"));
});

async function wipeUser(uid: string) {
  const userRef = db.collection("users").doc(uid);
  const children = await userRef.collection("children").get();
  for (const child of children.docs) {
    for (const nested of ["wellState", "wellQuestions", "childAtlas"] as const) {
      const nest = await child.ref.collection(nested).get();
      for (const d of nest.docs) await d.ref.delete();
    }
    await child.ref.delete();
  }
  await userRef.delete().catch(() => undefined);
}

async function seedUser(
  uid: string,
  subscription: { subscriptionStatus: string; isLifetime: boolean },
  economy: Record<string, unknown> = {},
) {
  await db
    .collection("users")
    .doc(uid)
    .set({
      email: `${uid}@example.com`,
      subscription,
      currentWonder: 42,
      storedWonder: 7,
      lifetimeWonderEarned: 100,
      inventory: { parts: 3, baitMaterials: { feather: 1, scale: 2, glimmerdust: 0 } },
      ...economy,
    });
}

const baseInput = (draftId: string, name = "Mira") => ({
  draftId,
  name,
  dob: "2018-06-01",
  companionId: "blackbird" as const,
  interests: ["curious"],
});

test("same draftId twice → same child, zero duplicates", async () => {
  const uid = "emu_draft_idempotent";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "wooden", isLifetime: false });

  const draftId = "draft_retry_same";
  const first = await createChildProfileCallable(uid, baseInput(draftId));
  const second = await createChildProfileCallable(uid, baseInput(draftId, "OtherName"));

  assert.equal(first.childId, second.childId);
  assert.equal(first.status, "ok");
  assert.equal(second.status, "ok");
  assert.equal(first.name, "Mira");
  assert.equal(second.name, "Mira");

  const kids = await db.collection("users").doc(uid).collection("children").get();
  assert.equal(kids.size, 1);
});

test("fresh draftId under cap → creates next child", async () => {
  const uid = "emu_draft_under_cap";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "wooden", isLifetime: false });

  const a = await createChildProfileCallable(uid, baseInput("draft_a", "One"));
  const b = await createChildProfileCallable(uid, baseInput("draft_b", "Two"));

  assert.notEqual(a.childId, b.childId);
  assert.equal(a.childOrder, 1);
  assert.equal(b.childOrder, 2);

  const kids = await db.collection("users").doc(uid).collection("children").get();
  assert.equal(kids.size, 2);
});

test("fresh draftId at cap → CHILD_LIMIT_REACHED, zero new child", async () => {
  const uid = "emu_draft_at_cap";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "free", isLifetime: false });

  await createChildProfileCallable(uid, baseInput("draft_first", "Only"));

  let err: unknown;
  try {
    await createChildProfileCallable(uid, baseInput("draft_second", "Nope"));
  } catch (e) {
    err = e;
  }

  assert.ok(err instanceof HttpsError);
  assert.equal((err as HttpsError).message, CHILD_LIMIT_REACHED);

  const kids = await db.collection("users").doc(uid).collection("children").get();
  assert.equal(kids.size, 1);
});

test("concurrent fresh draftIds with one slot left → exactly one wins", async () => {
  const uid = "emu_draft_race";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "wooden", isLifetime: false });

  await createChildProfileCallable(uid, baseInput("draft_r1", "One"));
  await createChildProfileCallable(uid, baseInput("draft_r2", "Two"));

  const results = await Promise.allSettled([
    createChildProfileCallable(uid, baseInput("draft_race_a", "RaceA")),
    createChildProfileCallable(uid, baseInput("draft_race_b", "RaceB")),
  ]);

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  const rej = rejected[0] as PromiseRejectedResult;
  assert.ok(rej.reason instanceof HttpsError);
  assert.equal((rej.reason as HttpsError).message, CHILD_LIMIT_REACHED);

  const kids = await db.collection("users").doc(uid).collection("children").get();
  assert.equal(kids.size, 3);
});

test("compatibility boundary: economy fields byte-identical across activeChildId switch", async () => {
  const uid = "emu_economy_switch";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "wooden", isLifetime: false });

  await db.collection("users").doc(uid).collection("creatures").doc("creature_1").set({
    creatureId: "creature_1",
    caughtAt: Date.now(),
  });
  await db.collection("users").doc(uid).collection("playerRods").doc("basic").set({
    rodId: "basic",
    state: "ready",
  });
  await db.collection("users").doc(uid).collection("diaryEntries").doc("d1").set({
    text: "hello",
  });

  const childA = await createChildProfileCallable(uid, baseInput("draft_econ_a", "A"));
  const childB = await createChildProfileCallable(uid, baseInput("draft_econ_b", "B"));

  const snapEconomy = async () => {
    const user = (await db.collection("users").doc(uid).get()).data() ?? {};
    const creatures = await db.collection("users").doc(uid).collection("creatures").get();
    const rods = await db.collection("users").doc(uid).collection("playerRods").get();
    const diary = await db.collection("users").doc(uid).collection("diaryEntries").get();
    return {
      currentWonder: user.currentWonder,
      storedWonder: user.storedWonder,
      lifetimeWonderEarned: user.lifetimeWonderEarned,
      inventory: user.inventory,
      creatures: creatures.docs.map((d) => ({ id: d.id, data: d.data() })),
      rods: rods.docs.map((d) => ({ id: d.id, data: d.data() })),
      diary: diary.docs.map((d) => ({ id: d.id, data: d.data() })),
    };
  };

  await db.collection("users").doc(uid).set({ activeChildId: childA.childId }, { merge: true });
  const before = JSON.stringify(await snapEconomy());

  await db.collection("users").doc(uid).set({ activeChildId: childB.childId }, { merge: true });
  const after = JSON.stringify(await snapEconomy());

  assert.equal(after, before);
});

test("deletion backup/scrub/restore covers ALL children subtrees", async () => {
  const uid = "emu_deletion_children";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "wooden", isLifetime: false });

  const c1 = await createChildProfileCallable(uid, baseInput("draft_del_1", "One"));
  const c2 = await createChildProfileCallable(uid, baseInput("draft_del_2", "Two"));

  await db
    .collection("users")
    .doc(uid)
    .collection("children")
    .doc(c1.childId)
    .collection("wellState")
    .doc("current")
    .set({ insightCount: 3 });
  await db
    .collection("users")
    .doc(uid)
    .collection("children")
    .doc(c2.childId)
    .collection("childAtlas")
    .doc("a1")
    .set({ category: "curiosity", reflectionText: "hello world xx" });

  const backup = await backupAllChildrenSubtrees(uid);
  assert.equal(backup.length, 2);
  assert.ok(backup.some((b) => b.childId === c1.childId && b.wellStateCurrent != null));
  assert.ok(backup.some((b) => b.childId === c2.childId && (b.childAtlas?.length ?? 0) === 1));

  const encrypted = encryptRestorePayload({
    email: "x@example.com",
    children: backup,
    activeChildId: c1.childId,
    childrenSummary: [
      { childId: c1.childId, name: "One", companionId: "blackbird", childOrder: 1 },
      { childId: c2.childId, name: "Two", companionId: "blackbird", childOrder: 2 },
    ],
  });
  const decrypted = decryptRestorePayload(encrypted);
  assert.equal(decrypted.children?.length, 2);

  await deleteAllChildrenSubtrees(uid);
  const afterDelete = await db.collection("users").doc(uid).collection("children").get();
  assert.equal(afterDelete.size, 0);

  await restoreChildrenSubtrees(uid, decrypted.children);
  const afterRestore = await db.collection("users").doc(uid).collection("children").get();
  assert.equal(afterRestore.size, 2);

  const well = await db
    .collection("users")
    .doc(uid)
    .collection("children")
    .doc(c1.childId)
    .collection("wellState")
    .doc("current")
    .get();
  assert.equal(well.data()?.insightCount, 3);

  const atlas = await db
    .collection("users")
    .doc(uid)
    .collection("children")
    .doc(c2.childId)
    .collection("childAtlas")
    .doc("a1")
    .get();
  assert.equal(atlas.exists, true);
});

test("onboardingComplete rejects quickCheckTally shorter than 5", async () => {
  const uid = "emu_onboarding_tally_len";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "free", isLifetime: false });

  let err: unknown;
  try {
    await createChildProfileCallable(uid, {
      ...baseInput("draft_onboarding_short", "Kid"),
      companionId: "pond_fish",
      interests: [],
      onboardingComplete: true,
      quickCheckTally: ["storm"],
    });
  } catch (e) {
    err = e;
  }

  assert.ok(err instanceof HttpsError);
  assert.equal((err as HttpsError).code, "invalid-argument");
  assert.match((err as HttpsError).message, /exactly 5/);

  const kids = await db.collection("users").doc(uid).collection("children").get();
  assert.equal(kids.size, 0);
});
