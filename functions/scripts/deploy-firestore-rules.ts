/**
 * Publish firestore.rules via Firebase Admin (bypasses firebase-tools serviceusage check).
 *
 * Usage:
 *   cd functions && npm run deploy:firestore-rules
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env.local.
 * Prerequisite: Cloud Firestore database (default) must exist in Firebase Console.
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

async function main(): Promise<void> {
  const rulesPath = path.join(__dirname, "..", "..", "firestore.rules");
  const source = fs.readFileSync(rulesPath, "utf8");

  const rulesFile = admin.securityRules().createRulesFileFromSource("firestore.rules", source);

  const ruleset = await admin.securityRules().createRuleset(rulesFile);

  await admin.securityRules().releaseFirestoreRuleset(ruleset.name);

  console.log(`Published Firestore rules: ${ruleset.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
