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
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const PROJECT_ID = "into-the-pond-rules-test";
const RULES_PATH = resolve(__dirname, "..", "firestore.rules");
const OWNER_UID = "test_owner_uid";
const OTHER_UID = "other_user_uid";

let testEnv: RulesTestEnvironment;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, "utf8"),
    },
  });
});

test.after(async () => {
  await testEnv?.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

function ownerDb() {
  return testEnv.authenticatedContext(OWNER_UID).firestore();
}

function otherDb() {
  return testEnv.authenticatedContext(OTHER_UID).firestore();
}

function unauthenticatedDb() {
  return testEnv.unauthenticatedContext().firestore();
}

async function seedOwnerProfile() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID), {
      email: "owner@example.com",
      hasSeenTutorial: false,
    });
  });
}

test("denies authenticated owner updating currentWonder", async () => {
  await seedOwnerProfile();
  await assertFails(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      currentWonder: 99,
    }),
  );
});

test("allows authenticated owner updating hasSeenTutorial", async () => {
  await seedOwnerProfile();
  await assertSucceeds(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      hasSeenTutorial: true,
    }),
  );
});

test("denies authenticated owner writing creatures subcollection", async () => {
  await seedOwnerProfile();
  await assertFails(
    setDoc(doc(ownerDb(), "users", OWNER_UID, "creatures", "creature_1"), {
      creatureId: "creature_1",
    }),
  );
});

test("denies authenticated owner writing economyLedger subcollection", async () => {
  await seedOwnerProfile();
  await assertFails(
    setDoc(doc(ownerDb(), "users", OWNER_UID, "economyLedger", "entry_1"), {
      id: "entry_1",
    }),
  );
});

async function seedEconomyLedgerEntry() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID, "economyLedger", "entry_1"), {
      id: "entry_1",
      uid: OWNER_UID,
      timestamp: Date.now(),
      actionType: "practice_complete",
      source: "practice_completion",
      deltaCurrentWonder: 1,
      deltaStoredWonder: 1,
      deltaParts: 0,
      deltaMaterials: {},
      idempotencyKey: "practice:2026-01-01:test",
      metadata: {},
      schemaVersion: 1,
    });
  });
}

test("denies authenticated owner updating economyLedger entry", async () => {
  await seedOwnerProfile();
  await seedEconomyLedgerEntry();
  await assertFails(
    updateDoc(doc(ownerDb(), "users", OWNER_UID, "economyLedger", "entry_1"), {
      deltaCurrentWonder: 99,
    }),
  );
});

test("denies authenticated owner deleting economyLedger entry", async () => {
  await seedOwnerProfile();
  await seedEconomyLedgerEntry();
  await assertFails(deleteDoc(doc(ownerDb(), "users", OWNER_UID, "economyLedger", "entry_1")));
});

test("allows authenticated owner reading economyLedger entry", async () => {
  await seedOwnerProfile();
  await seedEconomyLedgerEntry();
  await assertSucceeds(getDoc(doc(ownerDb(), "users", OWNER_UID, "economyLedger", "entry_1")));
});

async function seedEconomyLedgerCheckpoint() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "users", OWNER_UID, "economyLedgerCheckpoint", "summary"),
      {
        schemaVersion: 1,
        foldedThroughTimestamp: 1,
        foldedThroughEntryId: "entry_0",
        foldedEntryCount: 1,
        foldSums: {
          currentWonder: 5,
          storedWonder: 5,
          parts: 0,
          feather: 0,
          scale: 0,
          glimmerdust: 0,
        },
        lifetimeWonderEarned: 5,
        compactedAt: Date.now(),
        compactedBy: "admin",
      },
    );
  });
}

test("denies authenticated owner writing economyLedgerCheckpoint", async () => {
  await seedOwnerProfile();
  await assertFails(
    setDoc(doc(ownerDb(), "users", OWNER_UID, "economyLedgerCheckpoint", "summary"), {
      schemaVersion: 1,
      foldedEntryCount: 1,
    }),
  );
});

test("allows authenticated owner reading economyLedgerCheckpoint", async () => {
  await seedOwnerProfile();
  await seedEconomyLedgerCheckpoint();
  await assertSucceeds(
    getDoc(doc(ownerDb(), "users", OWNER_UID, "economyLedgerCheckpoint", "summary")),
  );
});

test("denies authenticated owner writing wonderTransactions subcollection", async () => {
  await seedOwnerProfile();
  await assertFails(
    setDoc(doc(ownerDb(), "users", OWNER_UID, "wonderTransactions", "tx_1"), {
      id: "tx_1",
      amount: 5,
    }),
  );
});

async function seedWonderTransaction() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID, "wonderTransactions", "tx_1"), {
      id: "tx_1",
      userId: OWNER_UID,
      amount: 5,
      source: "practice_completion",
      metadata: {},
    });
  });
}

test("denies authenticated owner updating wonderTransactions entry", async () => {
  await seedOwnerProfile();
  await seedWonderTransaction();
  await assertFails(
    updateDoc(doc(ownerDb(), "users", OWNER_UID, "wonderTransactions", "tx_1"), {
      amount: 99,
    }),
  );
});

test("denies authenticated owner deleting wonderTransactions entry", async () => {
  await seedOwnerProfile();
  await seedWonderTransaction();
  await assertFails(deleteDoc(doc(ownerDb(), "users", OWNER_UID, "wonderTransactions", "tx_1")));
});

test("allows authenticated owner reading wonderTransactions entry", async () => {
  await seedOwnerProfile();
  await seedWonderTransaction();
  await assertSucceeds(getDoc(doc(ownerDb(), "users", OWNER_UID, "wonderTransactions", "tx_1")));
});

test("denies authenticated owner create users doc (server-only via initializeSanctuary)", async () => {
  await assertFails(
    setDoc(doc(ownerDb(), "users", OWNER_UID), {
      email: "owner@example.com",
      hasSeenTutorial: false,
      childArchetype: null,
      hasCompletedDay1Narrative: false,
    }),
  );
});

test("denies authenticated owner create with economy field currentWonder", async () => {
  await assertFails(
    setDoc(doc(ownerDb(), "users", OWNER_UID), {
      email: "owner@example.com",
      hasSeenTutorial: false,
      currentWonder: 0,
    }),
  );
});

test("denies authenticated owner writing diaryEntries subcollection", async () => {
  await seedOwnerProfile();
  await assertFails(
    setDoc(doc(ownerDb(), "users", OWNER_UID, "diaryEntries", "entry_1"), {
      status: "draft",
    }),
  );
});

test("denies unauthenticated read of user doc", async () => {
  await seedOwnerProfile();
  await assertFails(getDoc(doc(unauthenticatedDb(), "users", OWNER_UID)));
});

test("denies other user reading owner doc", async () => {
  await seedOwnerProfile();
  await assertFails(getDoc(doc(otherDb(), "users", OWNER_UID)));
});

test("denies client read of deletion_requests", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "deletion_requests", OWNER_UID), {
      encryptedPayload: "test",
    });
  });
  await assertFails(getDoc(doc(ownerDb(), "deletion_requests", OWNER_UID)));
});

test("denies client write of deletion_requests", async () => {
  await assertFails(
    setDoc(doc(ownerDb(), "deletion_requests", OWNER_UID), {
      encryptedPayload: "test",
    }),
  );
});

test("denies client read of financialRecords", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "financialRecords", "rec_1"), {
      productId: "wooden_monthly",
    });
  });
  await assertFails(getDoc(doc(ownerDb(), "financialRecords", "rec_1")));
});

test("allows authenticated owner reading deletionStatus on user doc", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID), {
      email: "owner@example.com",
      hasSeenTutorial: false,
      deletionStatus: "pending",
      deletionPurgeAt: new Date(),
    });
  });
  await assertSucceeds(getDoc(doc(ownerDb(), "users", OWNER_UID)));
});

assert.ok(RULES_PATH);
