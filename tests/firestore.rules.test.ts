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
      // Multi-child restore payloads may include children[] — still write-denied to clients.
      encryptedPayload: JSON.stringify({
        children: [{ childId: "c1", data: { name: "x", childOrder: 1 } }],
      }),
      payloadVersion: 1,
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

test("denies authenticated owner updating deletionStatus", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID), {
      email: "owner@example.com",
      hasSeenTutorial: false,
      deletionStatus: "pending",
    });
  });
  await assertFails(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      deletionStatus: "active",
    }),
  );
});

/**
 * Admin / Cloud Functions use the Admin SDK (`db` from functions/src/init.ts), which
 * bypasses security rules. Rules-unit-testing `withSecurityRulesDisabled` is the
 * documented stand-in — confirm deletionStatus / deletionPurgeAt remain writable
 * in that context so Track A client-deny does not break requestAccountDeletion /
 * cancelAccountDeletion / purgeExpiredAccountDeletions.
 */
test("admin-context (rules disabled) can write deletionStatus and deletionPurgeAt", async () => {
  await seedOwnerProfile();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await assertSucceeds(
      updateDoc(doc(context.firestore(), "users", OWNER_UID), {
        deletionStatus: "pending",
        deletionPurgeAt: new Date(),
      }),
    );
  });
});

test("denies authenticated owner updating deletionPurgeAt", async () => {
  await seedOwnerProfile();
  await assertFails(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      deletionPurgeAt: new Date(),
    }),
  );
});

test("denies authenticated owner updating authFunnel", async () => {
  await seedOwnerProfile();
  await assertFails(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      authFunnel: { sanctuaryInitialized: true },
    }),
  );
});

test("allows authenticated owner updating childBirthDate", async () => {
  await seedOwnerProfile();
  await assertSucceeds(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      childBirthDate: "2018-06-01",
    }),
  );
});

test("allows authenticated owner updating narrativeProgress", async () => {
  await seedOwnerProfile();
  await assertSucceeds(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      narrativeProgress: { currentScene: 2, lastUpdated: "2026-01-01T00:00:00.000Z" },
    }),
  );
});

test("allows authenticated owner updating analyticsOptOut", async () => {
  await seedOwnerProfile();
  await assertSucceeds(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      analyticsOptOut: true,
    }),
  );
});

test("allows authenticated owner updating hasCompletedEmailVerifiedCelebration", async () => {
  await seedOwnerProfile();
  await assertSucceeds(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      hasCompletedEmailVerifiedCelebration: true,
    }),
  );
});

test("activeChildId remains client-writable under Track A + children rules", async () => {
  await seedOwnerProfile();
  await assertSucceeds(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      activeChildId: "child_switcher_1",
    }),
  );
});

test("client cannot write hasCompletedPrologueOnboarding directly", async () => {
  await seedOwnerProfile();
  await assertFails(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      hasCompletedPrologueOnboarding: true,
    }),
  );
});

test("denies authenticated owner mixed safe and forbidden profile update", async () => {
  await seedOwnerProfile();
  await assertFails(
    updateDoc(doc(ownerDb(), "users", OWNER_UID), {
      hasSeenTutorial: true,
      deletionStatus: "active",
    }),
  );
});

test("allows owner reading childOrder 1 under free subscription", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID), {
      email: "owner@example.com",
      subscription: { subscriptionStatus: "free", isLifetime: false },
    });
    await setDoc(doc(context.firestore(), "users", OWNER_UID, "children", "child_1"), {
      childOrder: 1,
      name: "One",
      profileLocked: true,
    });
  });
  await assertSucceeds(getDoc(doc(ownerDb(), "users", OWNER_UID, "children", "child_1")));
});

test("denies free owner reading childOrder 2", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID), {
      email: "owner@example.com",
      subscription: { subscriptionStatus: "free", isLifetime: false },
    });
    await setDoc(doc(context.firestore(), "users", OWNER_UID, "children", "child_2"), {
      childOrder: 2,
      name: "Two",
      profileLocked: true,
    });
  });
  await assertFails(getDoc(doc(ownerDb(), "users", OWNER_UID, "children", "child_2")));
});

/**
 * REGRESSION — catch-all owner-read OR semantics.
 * Free tier owner owns users/{uid} but must NOT read an over-limit child via the
 * catch-all `/{subcollection}/{document=**}` rule. If someone "simplifies" rules
 * by restoring unconditional owner read on the catch-all, this test must fail.
 */
test("free tier owner cannot read a locked/over-limit child doc even though they own the parent user doc", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID), {
      email: "owner@example.com",
      subscription: { subscriptionStatus: "free", isLifetime: false },
      currentWonder: 10,
    });
    await setDoc(doc(context.firestore(), "users", OWNER_UID, "children", "over_limit_child"), {
      childOrder: 2,
      name: "ShouldBeOpaque",
      profileLocked: true,
      dob: "2019-01-01",
    });
  });

  // Parent user doc is readable (ownership).
  await assertSucceeds(getDoc(doc(ownerDb(), "users", OWNER_UID)));
  // Over-limit child must still be denied — catch-all must not OR this open.
  await assertFails(getDoc(doc(ownerDb(), "users", OWNER_UID, "children", "over_limit_child")));
});

test("denies client write to children doc even when unlocked", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID), {
      email: "owner@example.com",
      subscription: { subscriptionStatus: "wooden", isLifetime: false },
    });
    await setDoc(doc(context.firestore(), "users", OWNER_UID, "children", "child_1"), {
      childOrder: 1,
      name: "One",
      profileLocked: false,
    });
  });
  await assertFails(
    updateDoc(doc(ownerDb(), "users", OWNER_UID, "children", "child_1"), {
      name: "Hacked",
    }),
  );
});

test("denies client write to locked child profile fields", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", OWNER_UID), {
      email: "owner@example.com",
      subscription: { subscriptionStatus: "wooden", isLifetime: false },
    });
    await setDoc(doc(context.firestore(), "users", OWNER_UID, "children", "child_1"), {
      childOrder: 1,
      name: "One",
      profileLocked: true,
      dob: "2018-01-01",
    });
  });
  await assertFails(
    setDoc(doc(ownerDb(), "users", OWNER_UID, "children", "child_1"), {
      childOrder: 1,
      name: "Changed",
      profileLocked: true,
      dob: "2019-01-01",
    }),
  );
});

test("allows authenticated read of featureFlags doc", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "featureFlags", "childMigrationDualRead"), {
      rolloutState: "off",
      allowlistUids: [],
    });
  });
  await assertSucceeds(getDoc(doc(ownerDb(), "featureFlags", "childMigrationDualRead")));
});

test("allows unauthenticated read of featureFlags doc (Gate Part 1)", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "featureFlags", "newOnboardingEnabled"), {
      rolloutState: "all",
      allowlistUids: [],
    });
  });
  await assertSucceeds(getDoc(doc(unauthenticatedDb(), "featureFlags", "newOnboardingEnabled")));
});

test("denies client write to featureFlags doc", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "featureFlags", "childMigrationDualRead"), {
      rolloutState: "off",
      allowlistUids: [],
    });
  });
  await assertFails(
    setDoc(doc(ownerDb(), "featureFlags", "childMigrationDualRead"), {
      rolloutState: "allowlist",
      allowlistUids: [OWNER_UID],
    }),
  );
  await assertFails(
    updateDoc(doc(ownerDb(), "featureFlags", "childMigrationDualRead"), {
      allowlistUids: [OWNER_UID],
    }),
  );
});

assert.ok(RULES_PATH);
