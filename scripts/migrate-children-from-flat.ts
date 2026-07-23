/**
 * Non-destructive COPY migration planner: legacy flat child fields + Well/Atlas →
 * users/{uid}/children/{firstChildId}.
 *
 * Default mode: dry-run (no Firestore writes).
 *
 * Scoped live pilot (explicit UID list ONLY — never an all-users scan):
 *   node --import tsx scripts/migrate-children-from-flat.ts \
 *     --uids=UID1,UID2 --rollback-dry-run
 *   CONFIRM_SCOPED_LIVE_PILOT=I_UNDERSTAND_SCOPED_LIVE_ONLY \
 *     node --import tsx scripts/migrate-children-from-flat.ts \
 *     --uids=UID1,UID2 --commit
 *   CONFIRM_SCOPED_LIVE_PILOT=I_UNDERSTAND_SCOPED_LIVE_ONLY \
 *     node --import tsx scripts/migrate-children-from-flat.ts \
 *     --uids=UID1,UID2 --rollback-commit
 *
 * Fixture / CR-approved sample audit:
 *   Prefer scripts/migration-audit-step0-guard.sh → step1 → step2.
 *   --interactive: fail closed without TTY / CONFIRM_MIGRATION_AUDIT.
 *   Console summary only by default — durable plan JSON requires --write-plan.
 *
 * Unscoped --commit (all users / file without --uids) remains disabled.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

type UserExport = {
  uid: string;
  data: Record<string, unknown>;
  wellStateCurrent?: Record<string, unknown> | null;
  wellQuestions?: Array<{ id: string; data: Record<string, unknown> }>;
  childAtlas?: Array<{ id: string; data: Record<string, unknown> }>;
  /** Existing children docs from export — used for idempotent skip. */
  children?: Array<{ id: string; data: Record<string, unknown> }>;
};

type ExportFile = { users: UserExport[] };

type PlannedChild = {
  uid: string;
  childId: string;
  childOrder: 1;
  profileLocked: true;
  name: string;
  dob: string | null;
  companionId: "blackbird";
  archetype: unknown;
  hasCompletedDay1Narrative: boolean;
  narrativeProgress: unknown;
  copyWellState: boolean;
  copyWellQuestions: number;
  copyChildAtlas: number;
  /** Root user fields seeded in the same pass (plan §8 step 2). */
  activeChildId: string;
  childrenSummary: Array<{
    childId: string;
    name: string;
    companionId: "blackbird";
    childOrder: 1;
  }>;
  skipReason?: string;
};

type AdminDb = {
  collection: (name: string) => {
    doc: (id: string) => UserDocRef;
  };
  batch: () => {
    set: (ref: unknown, data: unknown, opts?: { merge?: boolean }) => void;
    commit: () => Promise<void>;
  };
};

type UserDocRef = {
  get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
  set: (data: unknown, opts?: { merge?: boolean }) => Promise<void>;
  collection: (name: string) => {
    doc: (id: string) => {
      get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
      set: (data: unknown, opts?: { merge?: boolean }) => Promise<void>;
      delete: () => Promise<void>;
      collection: (name: string) => {
        doc: (id: string) => {
          get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
          set: (data: unknown, opts?: { merge?: boolean }) => Promise<void>;
          delete: () => Promise<void>;
        };
        limit: (n: number) => {
          get: () => Promise<{
            docs: Array<{
              id: string;
              data: () => Record<string, unknown>;
              ref: { delete: () => Promise<void> };
            }>;
            size: number;
          }>;
        };
      };
    };
    limit: (n: number) => {
      get: () => Promise<{
        docs: Array<{
          id: string;
          data: () => Record<string, unknown>;
          ref: { delete: () => Promise<void> };
        }>;
        size: number;
      }>;
    };
  };
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const requireFromFunctions = createRequire(path.join(root, "functions/package.json"));
const args = process.argv.slice(2);
const commit = args.includes("--commit");
const interactive = args.includes("--interactive");
/** Extra readline ack inside the Node process (shell wrappers already prompt). */
const confirmEach = args.includes("--confirm-each");
const writePlan = args.includes("--write-plan");
const rollbackDryRun = args.includes("--rollback-dry-run");
const rollbackCommit = args.includes("--rollback-commit");
const inputArg = args.find((a) => a.startsWith("--input="));
const inputPath = inputArg
  ? path.resolve(inputArg.slice("--input=".length))
  : path.resolve(__dirname, "../tmp/children-migration-fixture.json");
const uidsArg = args.find((a) => a.startsWith("--uids="));
const scopedUids = uidsArg
  ? uidsArg
      .slice("--uids=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

const SCOPED_CONFIRM = "I_UNDERSTAND_SCOPED_LIVE_ONLY";
const MAX_SCOPED_UIDS = 8;

function loadDotenv(): void {
  for (const name of ["functions/.env.local", ".env.local"] as const) {
    const envPath = path.join(root, name);
    if (!fs.existsSync(envPath)) continue;
    try {
      requireFromFunctions("dotenv").config({ path: envPath });
    } catch {
      /* optional */
    }
  }
}

function deterministicChildId(uid: string): string {
  // Stable first-child id for dual-read / idempotent re-runs (not a secret).
  return `child_1_${uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;
}

function planUser(user: UserExport): PlannedChild {
  const childId = deterministicChildId(user.uid);
  const dob =
    typeof user.data.childBirthDate === "string" && user.data.childBirthDate.trim()
      ? user.data.childBirthDate.trim()
      : null;
  const hasNarrative =
    user.data.hasCompletedDay1Narrative === true || user.data.childArchetype != null || dob != null;

  const name = "Friend";
  const companionId = "blackbird" as const;
  const childrenSummary = [{ childId, name, companionId, childOrder: 1 as const }];

  const existingChildren = user.children ?? [];
  const alreadyHasChildDoc = existingChildren.some((c) => c.id === childId);
  const alreadyHasActive =
    typeof user.data.activeChildId === "string" && user.data.activeChildId.length > 0;
  const alreadyHasSummary =
    Array.isArray(user.data.childrenSummary) && user.data.childrenSummary.length > 0;

  if (alreadyHasChildDoc || alreadyHasActive || alreadyHasSummary) {
    return {
      uid: user.uid,
      childId,
      childOrder: 1,
      profileLocked: true,
      name,
      dob,
      companionId,
      archetype: user.data.childArchetype ?? null,
      hasCompletedDay1Narrative: user.data.hasCompletedDay1Narrative === true,
      narrativeProgress: user.data.narrativeProgress ?? null,
      copyWellState: false,
      copyWellQuestions: 0,
      copyChildAtlas: 0,
      activeChildId: childId,
      childrenSummary,
      skipReason: "already_migrated",
    };
  }

  if (!hasNarrative && !user.wellStateCurrent && !user.childAtlas?.length) {
    return {
      uid: user.uid,
      childId,
      childOrder: 1,
      profileLocked: true,
      name,
      dob,
      companionId,
      archetype: user.data.childArchetype ?? null,
      hasCompletedDay1Narrative: false,
      narrativeProgress: user.data.narrativeProgress ?? null,
      copyWellState: false,
      copyWellQuestions: 0,
      copyChildAtlas: 0,
      activeChildId: childId,
      childrenSummary,
      skipReason: "no_child_specific_data",
    };
  }

  return {
    uid: user.uid,
    childId,
    childOrder: 1,
    profileLocked: true,
    name,
    dob,
    companionId,
    archetype: user.data.childArchetype ?? null,
    hasCompletedDay1Narrative: user.data.hasCompletedDay1Narrative === true,
    narrativeProgress: user.data.narrativeProgress ?? null,
    copyWellState: user.wellStateCurrent != null,
    copyWellQuestions: user.wellQuestions?.length ?? 0,
    copyChildAtlas: user.childAtlas?.length ?? 0,
    activeChildId: childId,
    childrenSummary,
  };
}

function initAdminDb(): { db: AdminDb; FieldValue: { delete: () => unknown } } {
  loadDotenv();
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!keyPath) {
    throw new Error("Set FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env.local");
  }
  const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(root, keyPath);
  const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf8")) as object;
  const admin = requireFromFunctions("firebase-admin") as {
    apps: unknown[];
    initializeApp: (opts: unknown) => void;
    credential: { cert: (sa: object) => unknown };
    firestore: {
      (): AdminDb;
      FieldValue: { delete: () => unknown };
    };
  };
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "into-the-pond",
    });
  }
  return { db: admin.firestore(), FieldValue: admin.firestore.FieldValue };
}

async function fetchScopedUsers(db: AdminDb, uids: string[]): Promise<UserExport[]> {
  const users: UserExport[] = [];
  for (const uid of uids) {
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      throw new Error(`User not found (refusing to invent): ${uid}`);
    }
    const data = { ...(snap.data() as Record<string, unknown>) };
    delete data.email;
    const wellState = await userRef.collection("wellState").doc("current").get();
    const wellQuestions = await userRef.collection("wellQuestions").limit(50).get();
    const childAtlas = await userRef.collection("childAtlas").limit(50).get();
    const children = await userRef.collection("children").limit(10).get();
    users.push({
      uid,
      data,
      wellStateCurrent: wellState.exists ? (wellState.data() as Record<string, unknown>) : null,
      wellQuestions: wellQuestions.docs.map((d) => ({
        id: d.id,
        data: d.data() as Record<string, unknown>,
      })),
      childAtlas: childAtlas.docs.map((d) => ({
        id: d.id,
        data: d.data() as Record<string, unknown>,
      })),
      children: children.docs.map((d) => ({
        id: d.id,
        data: d.data() as Record<string, unknown>,
      })),
    });
  }
  return users;
}

function spotCheckSnapshot(user: UserExport): Record<string, unknown> {
  const existingIds = (user.children ?? []).map((c) => c.id);
  return {
    uid: user.uid,
    activeChildId: user.data.activeChildId ?? null,
    childrenSummary: user.data.childrenSummary ?? null,
    childBirthDate: user.data.childBirthDate ?? null,
    childArchetype: user.data.childArchetype ?? null,
    hasCompletedDay1Narrative: user.data.hasCompletedDay1Narrative === true,
    existingChildIds: existingIds,
    rootWellState: user.wellStateCurrent != null,
    rootWellQuestions: user.wellQuestions?.length ?? 0,
    rootChildAtlas: user.childAtlas?.length ?? 0,
  };
}

function rollbackOpsForPlan(p: PlannedChild): Record<string, unknown> {
  return {
    uid: p.uid,
    unsetUserFields: ["activeChildId", "childrenSummary"],
    deleteChildDoc: `users/${p.uid}/children/${p.childId}`,
    deleteNested: {
      wellState: Boolean(p.copyWellState),
      wellQuestions: p.copyWellQuestions,
      childAtlas: p.copyChildAtlas,
    },
    note: "COPY migration rollback deletes only the migrated child doc + copied nested docs; legacy root fields are left intact.",
  };
}

async function commitOne(db: AdminDb, plan: PlannedChild, user: UserExport): Promise<void> {
  const userRef = db.collection("users").doc(plan.uid);
  const childRef = userRef.collection("children").doc(plan.childId);
  const batch = db.batch();

  batch.set(
    childRef,
    {
      name: plan.name,
      dob: plan.dob,
      companionId: plan.companionId,
      interests: [],
      profileLocked: true,
      childOrder: 1,
      archetype: plan.archetype ?? null,
      hasCompletedDay1Narrative: plan.hasCompletedDay1Narrative,
      narrativeProgress: plan.narrativeProgress ?? null,
      migratedFromFlatAt: new Date().toISOString(),
      migrationSource: "flat_copy_v1",
    },
    { merge: true },
  );

  if (plan.copyWellState && user.wellStateCurrent) {
    batch.set(childRef.collection("wellState").doc("current"), user.wellStateCurrent, {
      merge: true,
    });
  }
  if (plan.copyWellQuestions > 0) {
    for (const q of user.wellQuestions ?? []) {
      batch.set(childRef.collection("wellQuestions").doc(q.id), q.data, { merge: true });
    }
  }
  if (plan.copyChildAtlas > 0) {
    for (const a of user.childAtlas ?? []) {
      batch.set(childRef.collection("childAtlas").doc(a.id), a.data, { merge: true });
    }
  }

  batch.set(
    userRef,
    {
      activeChildId: plan.activeChildId,
      childrenSummary: plan.childrenSummary,
    },
    { merge: true },
  );

  await batch.commit();
}

async function rollbackOne(
  db: AdminDb,
  plan: PlannedChild,
  FieldValue: { delete: () => unknown },
): Promise<void> {
  const userRef = db.collection("users").doc(plan.uid);
  const childRef = userRef.collection("children").doc(plan.childId);

  if (plan.copyWellState) {
    await childRef
      .collection("wellState")
      .doc("current")
      .delete()
      .catch(() => undefined);
  }
  if (plan.copyWellQuestions > 0) {
    const qs = await childRef.collection("wellQuestions").limit(50).get();
    await Promise.all(qs.docs.map((d) => d.ref.delete()));
  }
  if (plan.copyChildAtlas > 0) {
    const atlas = await childRef.collection("childAtlas").limit(50).get();
    await Promise.all(atlas.docs.map((d) => d.ref.delete()));
  }
  await childRef.delete();
  await userRef.set(
    {
      activeChildId: FieldValue.delete(),
      childrenSummary: FieldValue.delete(),
    },
    { merge: true },
  );
}

async function assertInteractiveGate(): Promise<void> {
  if (!interactive) return;

  const tty = Boolean(process.stdin.isTTY);
  const envOk = process.env.CONFIRM_MIGRATION_AUDIT === "I_UNDERSTAND_DRY_RUN_ONLY";
  if (!tty || !envOk) {
    console.error(
      "WARNING: --interactive requires a TTY and CONFIRM_MIGRATION_AUDIT=I_UNDERSTAND_DRY_RUN_ONLY",
    );
    console.error(
      "This planner performs NO prod export, NO rollback generation, and (without --write-plan) writes NO durable files.",
    );
    process.exit(1);
  }

  if (!confirmEach) return;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question("Type DRY-RUN to run the planner (console summary only): ", resolve);
  });
  rl.close();
  if (answer.trim() !== "DRY-RUN") {
    console.error("Aborted.");
    process.exit(1);
  }
}

function assertScopedWriteGate(): void {
  if (process.env.CONFIRM_SCOPED_LIVE_PILOT !== SCOPED_CONFIRM) {
    console.error(`Refusing scoped write without CONFIRM_SCOPED_LIVE_PILOT=${SCOPED_CONFIRM}`);
    process.exit(1);
  }
  if (!scopedUids || scopedUids.length === 0) {
    console.error("Scoped writes require --uids=UID1,UID2 (explicit list).");
    process.exit(1);
  }
}

function printPlanSummary(
  plans: PlannedChild[],
  actionable: PlannedChild[],
  skipped: PlannedChild[],
  modeLabel: string,
  sourceLabel: string,
): void {
  const skipByReason = new Map<string, number>();
  for (const p of skipped) {
    const reason = p.skipReason ?? "unknown";
    skipByReason.set(reason, (skipByReason.get(reason) ?? 0) + 1);
  }

  console.log("=== children flat→subcollection migration (COPY, non-destructive) ===");
  console.log(`mode: ${modeLabel}`);
  console.log(`source: ${sourceLabel}`);
  if (scopedUids) {
    console.log(`scoped uids (${scopedUids.length}): ${scopedUids.join(",")}`);
  }
  console.log(`users scanned: ${plans.length}`);
  console.log(`would migrate: ${actionable.length}`);
  console.log(`skipped: ${skipped.length}`);
  for (const [reason, count] of [...skipByReason.entries()].sort()) {
    console.log(`  skip:${reason}: ${count}`);
  }
  if (skipped.length !== [...skipByReason.values()].reduce((a, b) => a + b, 0)) {
    console.error("BUG: silent skips detected — skip reason counts do not sum to skipped");
    process.exit(1);
  }
}

async function main() {
  await assertInteractiveGate();

  if ((commit || rollbackCommit) && !scopedUids) {
    console.error(
      "Refusing --commit/--rollback-commit without --uids=… (unscoped live writes are disabled).",
    );
    console.error(
      "Full-scale migration stays blocked pending Change Request authorization (see docs/rollback/children-migration-audit.md).",
    );
    process.exit(1);
  }

  if (scopedUids) {
    if (scopedUids.length === 0) {
      console.error("--uids= provided but empty");
      process.exit(1);
    }
    if (scopedUids.length > MAX_SCOPED_UIDS) {
      console.error(
        `--uids list too large (${scopedUids.length} > ${MAX_SCOPED_UIDS}). Scoped pilot only.`,
      );
      process.exit(1);
    }
    const unique = new Set(scopedUids);
    if (unique.size !== scopedUids.length) {
      console.error("--uids contains duplicates — refusing");
      process.exit(1);
    }
  }

  let users: UserExport[];
  let sourceLabel: string;
  let admin: { db: AdminDb; FieldValue: { delete: () => unknown } } | null = null;

  if (scopedUids) {
    admin = initAdminDb();
    users = await fetchScopedUsers(admin.db, scopedUids);
    sourceLabel = `live Admin get() for ${scopedUids.length} uid(s) only (no collection scan)`;
  } else {
    if (!fs.existsSync(inputPath)) {
      console.error(`Input not found: ${inputPath}`);
      console.error("Provide --input=path/to/approved.json (fixture or CR-approved sample).");
      console.error("Or pass --uids=UID1,UID2 for a scoped live fetch (get-by-id only).");
      process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(inputPath, "utf8")) as ExportFile;
    if (!Array.isArray(raw.users)) {
      console.error("Invalid export: expected { users: [...] }");
      process.exit(1);
    }
    users = raw.users;
    sourceLabel = `file:${inputPath}`;
  }

  const plans = users.map(planUser);
  const actionable = plans.filter((p) => !p.skipReason);
  const skipped = plans.filter((p) => p.skipReason);

  const writing = commit || rollbackCommit;
  const modeLabel = rollbackCommit
    ? "ROLLBACK-COMMIT (scoped writes)"
    : commit
      ? "COMMIT (scoped writes)"
      : rollbackDryRun
        ? "ROLLBACK-DRY-RUN (no writes)"
        : "DRY-RUN (no writes)";

  printPlanSummary(plans, actionable, skipped, modeLabel, sourceLabel);

  console.log("\n=== BEFORE spot-check (per uid) ===");
  for (const u of users) {
    console.log(JSON.stringify(spotCheckSnapshot(u), null, 2));
  }

  console.log("\nSample would-migrate (up to 5):");
  for (const p of actionable.slice(0, 5)) {
    console.log(
      JSON.stringify(
        {
          uid: p.uid,
          childId: p.childId,
          dob: p.dob,
          archetype: p.archetype,
          profileLocked: p.profileLocked,
          activeChildId: p.activeChildId,
          childrenSummary: p.childrenSummary,
          copyWellState: p.copyWellState,
          copyWellQuestions: p.copyWellQuestions,
          copyChildAtlas: p.copyChildAtlas,
        },
        null,
        2,
      ),
    );
  }
  console.log("Sample skipped (up to 5):");
  for (const p of skipped.slice(0, 5)) {
    console.log(
      JSON.stringify(
        {
          uid: p.uid,
          skipReason: p.skipReason,
          childId: p.childId,
          dob: p.dob,
          archetype: p.archetype,
          hasActiveChildId:
            typeof users.find((u) => u.uid === p.uid)?.data.activeChildId === "string",
          existingChildIds: (users.find((u) => u.uid === p.uid)?.children ?? []).map((c) => c.id),
        },
        null,
        2,
      ),
    );
  }

  if (rollbackDryRun || rollbackCommit) {
    console.log("\n=== ROLLBACK ops (actionable / would-migrate only) ===");
    if (actionable.length === 0) {
      console.log(
        "(none — nothing to roll back from this planner pass; already_migrated smoke children are NOT deleted by this rollback)",
      );
    }
    for (const p of actionable) {
      console.log(JSON.stringify(rollbackOpsForPlan(p), null, 2));
    }
  }

  if (writing) {
    assertScopedWriteGate();
    if (!admin) admin = initAdminDb();

    if (commit) {
      for (const p of actionable) {
        const user = users.find((u) => u.uid === p.uid);
        if (!user) throw new Error(`missing user export for ${p.uid}`);
        console.log(`\nCOMMIT uid=${p.uid} childId=${p.childId}`);
        await commitOne(admin.db, p, user);
      }
      if (actionable.length === 0) {
        console.log("\nCOMMIT: no actionable users (all skipped) — no writes performed.");
      }
    }

    if (rollbackCommit) {
      for (const p of actionable) {
        console.log(`\nROLLBACK-COMMIT uid=${p.uid} childId=${p.childId}`);
        await rollbackOne(admin.db, p, admin.FieldValue);
      }
      if (actionable.length === 0) {
        console.log(
          "\nROLLBACK-COMMIT: no actionable plans — refusing to delete already_migrated / smoke children.",
        );
      }
    }

    const afterUsers = await fetchScopedUsers(admin.db, scopedUids!);
    console.log("\n=== AFTER spot-check (per uid) ===");
    for (const u of afterUsers) {
      console.log(JSON.stringify(spotCheckSnapshot(u), null, 2));
      const afterPlan = planUser(u);
      console.log(
        JSON.stringify(
          {
            uid: u.uid,
            replanSkipReason: afterPlan.skipReason ?? null,
            replanChildId: afterPlan.childId,
          },
          null,
          2,
        ),
      );
    }
  }

  if (writePlan) {
    const outDir = path.resolve(__dirname, "../tmp");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(
      outDir,
      scopedUids ? "children-migration-scoped-pilot.json" : "children-migration-dry-run.json",
    );
    const skipByReason = new Map<string, number>();
    for (const p of skipped) {
      const r = p.skipReason ?? "unknown";
      skipByReason.set(r, (skipByReason.get(r) ?? 0) + 1);
    }
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          mode: writing ? (rollbackCommit ? "rollback-commit" : "commit") : "dry-run",
          scopedUids,
          scanned: plans.length,
          wouldMigrate: actionable.length,
          skipped: skipped.length,
          skipByReason: Object.fromEntries(skipByReason),
          actionable,
          plans,
          rollbackOps: actionable.map(rollbackOpsForPlan),
        },
        null,
        2,
      ),
    );
    console.log(`\nWrote plan: ${outPath}`);
  } else if (!scopedUids) {
    console.log(
      "\nNo durable plan file written (default). Pass --write-plan only when you intentionally need a local artifact.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
