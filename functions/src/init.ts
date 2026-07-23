import * as fs from "fs";
import * as path from "path";

import admin from "firebase-admin";

// Local-only env (gitignored). Prefer `.env.local` — Firebase deploy rejects `FIREBASE_*` keys in `.env`.
for (const name of [".env.local", ".env"] as const) {
  const envPath = path.join(__dirname, "..", name);
  if (!fs.existsSync(envPath)) continue;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: envPath });
  } catch {
    /* dotenv missing — use shell env only */
  }
}

/**
 * Firebase Admin initialization:
 * - **Deployed Cloud Functions:** `initializeApp()` with no args uses the runtime service account (recommended).
 *   Do not set `FIREBASE_SERVICE_ACCOUNT_PATH` in deployed `.env` / `.env.<project>` files.
 * - **Local / emulators:** set `FIREBASE_SERVICE_ACCOUNT_PATH` in `functions/.env.local` (see `.env.example`).
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
