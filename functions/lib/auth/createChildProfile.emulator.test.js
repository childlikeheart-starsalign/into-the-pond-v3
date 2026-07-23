"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Emulator E2E for createChildProfile + compatibility boundary.
 * Requires FIRESTORE_EMULATOR_HOST (set by scripts/run-create-child-profile-emulator-test.mjs).
 */
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const https_1 = require("firebase-functions/v2/https");
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
let db;
let createChildProfileCallable;
let CHILD_LIMIT_REACHED;
let backupAllChildrenSubtrees;
let deleteAllChildrenSubtrees;
let restoreChildrenSubtrees;
let encryptRestorePayload;
let decryptRestorePayload;
(0, node_test_1.before)(async () => {
  ({ createChildProfileCallable, CHILD_LIMIT_REACHED } = await Promise.resolve().then(() =>
    __importStar(require("./createChildProfile")),
  ));
  ({ db } = await Promise.resolve().then(() => __importStar(require("../init"))));
  ({ backupAllChildrenSubtrees, deleteAllChildrenSubtrees, restoreChildrenSubtrees } =
    await Promise.resolve().then(() => __importStar(require("./childrenDeletionBackup"))));
  ({ encryptRestorePayload, decryptRestorePayload } = await Promise.resolve().then(() =>
    __importStar(require("./deletionCrypto")),
  ));
});
async function wipeUser(uid) {
  const userRef = db.collection("users").doc(uid);
  const children = await userRef.collection("children").get();
  for (const child of children.docs) {
    for (const nested of ["wellState", "wellQuestions", "childAtlas"]) {
      const nest = await child.ref.collection(nested).get();
      for (const d of nest.docs) await d.ref.delete();
    }
    await child.ref.delete();
  }
  await userRef.delete().catch(() => undefined);
}
async function seedUser(uid, subscription, economy = {}) {
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
const baseInput = (draftId, name = "Mira") => ({
  draftId,
  name,
  dob: "2018-06-01",
  companionId: "blackbird",
  interests: ["curious"],
});
(0, node_test_1.default)("same draftId twice → same child, zero duplicates", async () => {
  const uid = "emu_draft_idempotent";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "wooden", isLifetime: false });
  const draftId = "draft_retry_same";
  const first = await createChildProfileCallable(uid, baseInput(draftId));
  const second = await createChildProfileCallable(uid, baseInput(draftId, "OtherName"));
  strict_1.default.equal(first.childId, second.childId);
  strict_1.default.equal(first.status, "ok");
  strict_1.default.equal(second.status, "ok");
  strict_1.default.equal(first.name, "Mira");
  strict_1.default.equal(second.name, "Mira");
  const kids = await db.collection("users").doc(uid).collection("children").get();
  strict_1.default.equal(kids.size, 1);
});
(0, node_test_1.default)("fresh draftId under cap → creates next child", async () => {
  const uid = "emu_draft_under_cap";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "wooden", isLifetime: false });
  const a = await createChildProfileCallable(uid, baseInput("draft_a", "One"));
  const b = await createChildProfileCallable(uid, baseInput("draft_b", "Two"));
  strict_1.default.notEqual(a.childId, b.childId);
  strict_1.default.equal(a.childOrder, 1);
  strict_1.default.equal(b.childOrder, 2);
  const kids = await db.collection("users").doc(uid).collection("children").get();
  strict_1.default.equal(kids.size, 2);
});
(0, node_test_1.default)("fresh draftId at cap → CHILD_LIMIT_REACHED, zero new child", async () => {
  const uid = "emu_draft_at_cap";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "free", isLifetime: false });
  await createChildProfileCallable(uid, baseInput("draft_first", "Only"));
  let err;
  try {
    await createChildProfileCallable(uid, baseInput("draft_second", "Nope"));
  } catch (e) {
    err = e;
  }
  strict_1.default.ok(err instanceof https_1.HttpsError);
  strict_1.default.equal(err.message, CHILD_LIMIT_REACHED);
  const kids = await db.collection("users").doc(uid).collection("children").get();
  strict_1.default.equal(kids.size, 1);
});
(0, node_test_1.default)(
  "concurrent fresh draftIds with one slot left → exactly one wins",
  async () => {
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
    strict_1.default.equal(fulfilled.length, 1);
    strict_1.default.equal(rejected.length, 1);
    const rej = rejected[0];
    strict_1.default.ok(rej.reason instanceof https_1.HttpsError);
    strict_1.default.equal(rej.reason.message, CHILD_LIMIT_REACHED);
    const kids = await db.collection("users").doc(uid).collection("children").get();
    strict_1.default.equal(kids.size, 3);
  },
);
(0, node_test_1.default)(
  "compatibility boundary: economy fields byte-identical across activeChildId switch",
  async () => {
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
    strict_1.default.equal(after, before);
  },
);
(0, node_test_1.default)("deletion backup/scrub/restore covers ALL children subtrees", async () => {
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
  strict_1.default.equal(backup.length, 2);
  strict_1.default.ok(backup.some((b) => b.childId === c1.childId && b.wellStateCurrent != null));
  strict_1.default.ok(
    backup.some((b) => b.childId === c2.childId && (b.childAtlas?.length ?? 0) === 1),
  );
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
  strict_1.default.equal(decrypted.children?.length, 2);
  await deleteAllChildrenSubtrees(uid);
  const afterDelete = await db.collection("users").doc(uid).collection("children").get();
  strict_1.default.equal(afterDelete.size, 0);
  await restoreChildrenSubtrees(uid, decrypted.children);
  const afterRestore = await db.collection("users").doc(uid).collection("children").get();
  strict_1.default.equal(afterRestore.size, 2);
  const well = await db
    .collection("users")
    .doc(uid)
    .collection("children")
    .doc(c1.childId)
    .collection("wellState")
    .doc("current")
    .get();
  strict_1.default.equal(well.data()?.insightCount, 3);
  const atlas = await db
    .collection("users")
    .doc(uid)
    .collection("children")
    .doc(c2.childId)
    .collection("childAtlas")
    .doc("a1")
    .get();
  strict_1.default.equal(atlas.exists, true);
});
(0, node_test_1.default)("onboardingComplete rejects quickCheckTally shorter than 5", async () => {
  const uid = "emu_onboarding_tally_len";
  await wipeUser(uid);
  await seedUser(uid, { subscriptionStatus: "free", isLifetime: false });
  let err;
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
  strict_1.default.ok(err instanceof https_1.HttpsError);
  strict_1.default.equal(err.code, "invalid-argument");
  strict_1.default.match(err.message, /exactly 5/);
  const kids = await db.collection("users").doc(uid).collection("children").get();
  strict_1.default.equal(kids.size, 0);
});
