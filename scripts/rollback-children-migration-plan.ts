/**
 * [PRIVILEGED] Dry-run rollback planner for children migration.
 * Prints inverse ops only after Change Request authorization.
 * Does NOT mutate Firestore.
 *
 * [BLOCKED] without:
 *   --change-request-id=CR-… --approved-by=<manager>
 *
 * Do NOT chain with prod export or live migration commit.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertChangeRequestAuthorized } from "./migrationChangeRequestGate";

type Plan = {
  uid: string;
  childId: string;
  skipReason?: string;
  activeChildId?: string;
  childrenSummary?: unknown;
  copyWellState?: boolean;
  copyWellQuestions?: number;
  copyChildAtlas?: number;
};

assertChangeRequestAuthorized(process.argv.slice(2), "children migration rollback-plan generation");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputArg = process.argv.find((a) => a.startsWith("--input="));
const writeOut = process.argv.includes("--write-plan");
const inputPath = inputArg
  ? path.resolve(inputArg.slice("--input=".length))
  : path.resolve(__dirname, "../tmp/children-migration-dry-run.json");

if (!fs.existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8")) as {
  plans?: Plan[];
  actionable?: Plan[];
};
const plans = raw.actionable ?? raw.plans ?? [];
if (!Array.isArray(plans)) {
  console.error("Expected { actionable: Plan[] } or { plans: Plan[] }");
  process.exit(1);
}

const rollbackOps = plans
  .filter((p) => !p.skipReason)
  .map((p) => ({
    uid: p.uid,
    unsetUserFields: ["activeChildId", "childrenSummary"],
    deleteChildDoc: `users/${p.uid}/children/${p.childId}`,
    deleteNested: {
      wellState: Boolean(p.copyWellState),
      wellQuestions: p.copyWellQuestions ?? 0,
      childAtlas: p.copyChildAtlas ?? 0,
    },
  }));

console.log("=== children migration ROLLBACK plan (dry-run ops, no Firestore writes) ===");
console.log(`input: ${inputPath}`);
console.log(`rollback targets: ${rollbackOps.length}`);
console.log("sample (up to 5):");
for (const op of rollbackOps.slice(0, 5)) {
  console.log(JSON.stringify(op, null, 2));
}

if (writeOut) {
  const outPath = path.resolve(__dirname, "../tmp/children-migration-rollback-plan.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), ops: rollbackOps }, null, 2),
  );
  console.log(`wrote ${outPath}`);
} else {
  console.log(
    "No durable rollback file written (default). Pass --write-plan only when intentionally needed.",
  );
}
