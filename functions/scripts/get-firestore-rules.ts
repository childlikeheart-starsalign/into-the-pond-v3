/**
 * Fetch the active production Firestore rules via Firebase Admin.
 *
 * Usage:
 *   cd functions && npm run get:firestore-rules
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env.local.
 */
import * as fs from "fs";
import * as path from "path";

import admin from "firebase-admin";

const PROJECT_ID = "into-the-pond";

const functionsEnvPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(functionsEnvPath)) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: functionsEnvPath });
  } catch {
    /* dotenv missing */
  }
}

if (admin.apps.length === 0) {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!keyPath) {
    console.error("Set FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env.local (see .env.example).");
    process.exit(1);
  }
  const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf8")) as admin.ServiceAccount;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });
}

function normalizeRulesSource(source: string): string {
  return source
    .replace(/\r\n/g, "\n")
    .replace(/allow create, update, delete: if false;/g, "allow write: if false;")
    .trim();
}

function extractEconomyBlocks(source: string): string {
  const blocks: string[] = [];
  for (const name of ["economyLedger", "economyIdempotency", "wonderTransactions"]) {
    const re = new RegExp(`match /${name}/\\{[^}]+\\} \\{[\\s\\S]*?\\n      \\}`, "m");
    const match = source.match(re);
    if (match) blocks.push(match[0]);
  }
  return blocks.join("\n\n");
}

async function main(): Promise<void> {
  const ruleset = await admin.securityRules().getFirestoreRuleset();
  const rulesetName = ruleset.name;
  const file = ruleset.source?.find((s) => s.name?.includes("firestore")) ?? ruleset.source?.[0];
  const source = file?.content ?? "";

  console.log(`# Project: ${PROJECT_ID}`);
  console.log(`# Active ruleset: ${rulesetName}`);
  console.log(`# Release: cloud.firestore (active)`);
  console.log("---");
  console.log(source);

  const repoRulesPath = path.join(__dirname, "..", "..", "firestore.rules");
  const repoSource = fs.readFileSync(repoRulesPath, "utf8");
  const prodNorm = normalizeRulesSource(source);
  const repoNorm = normalizeRulesSource(repoSource);
  const prodEconomy = extractEconomyBlocks(prodNorm);
  const repoEconomy = extractEconomyBlocks(repoNorm);

  console.error("\n--- economy blocks comparison ---");
  if (prodEconomy === repoEconomy) {
    console.error(
      "MATCH: economyLedger + economyIdempotency + wonderTransactions blocks match repo (normalized).",
    );
  } else {
    console.error("DRIFT: economy blocks differ from firestore.rules");
    console.error("\n[PROD economy blocks]\n" + prodEconomy);
    console.error("\n[REPO economy blocks]\n" + repoEconomy);
    process.exitCode = 2;
  }

  if (prodNorm !== repoNorm) {
    console.error("\n--- full rules diff ---");
    console.error("DRIFT: normalized full rules differ from firestore.rules");
    const prodLines = prodNorm.split("\n");
    const repoLines = repoNorm.split("\n");
    const max = Math.max(prodLines.length, repoLines.length);
    const diffs: string[] = [];
    for (let i = 0; i < max; i += 1) {
      const p = prodLines[i] ?? "";
      const r = repoLines[i] ?? "";
      if (p !== r) {
        diffs.push(`L${i + 1} PROD: ${p}`);
        diffs.push(`L${i + 1} REPO: ${r}`);
        if (diffs.length >= 20) break;
      }
    }
    console.error(diffs.join("\n"));
    process.exitCode = 2;
  } else {
    console.error("MATCH: full firestore.rules matches production (normalized).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
