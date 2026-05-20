import * as fs from "fs";
import * as path from "path";

import admin from "firebase-admin";

// Optional `functions/.env` (gitignored) so local emulators pick up FIREBASE_SERVICE_ACCOUNT_PATH without shell exports.
const functionsEnvPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(functionsEnvPath)) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: functionsEnvPath });
  } catch {
    /* dotenv missing — use shell env only */
  }
}

/**
 * Firebase Admin initialization:
 * - **Deployed Cloud Functions:** `initializeApp()` with no args uses the runtime service account (recommended).
 *   Do not set `FIREBASE_SERVICE_ACCOUNT_PATH` in production deploy.
 * - **Local / emulators:** set `FIREBASE_SERVICE_ACCOUNT_PATH` to your JSON key path (outside git), or copy
 *   [`.env.example`](./.env.example) to `functions/.env` and adjust the path.
 */
if (admin.apps.length === 0) {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (keyPath) {
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
    const raw = fs.readFileSync(resolved, "utf8");
    const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp();
  }
}

export const db = admin.firestore();
