/**
 * Mark a Firebase Auth user as email-verified (dev / ops).
 *
 * Usage:
 *   cd functions && npm run dev:verify-email -- engineer-preview@yourdomain.com
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env or the environment.
 */
import * as fs from "fs";
import * as path from "path";

import admin from "firebase-admin";

const functionsEnvPath = path.join(__dirname, "..", ".env");
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
    console.error("Set FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env (see .env.example).");
    process.exit(1);
  }
  const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf8")) as admin.ServiceAccount;
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const email = process.argv[2]?.trim() || "engineer-preview@yourdomain.com";

async function main(): Promise<void> {
  const user = await admin.auth().getUserByEmail(email);
  if (user.emailVerified) {
    console.log(`Already verified: ${email} (uid: ${user.uid})`);
    return;
  }
  await admin.auth().updateUser(user.uid, { emailVerified: true });
  console.log(`Marked email verified: ${email} (uid: ${user.uid})`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
