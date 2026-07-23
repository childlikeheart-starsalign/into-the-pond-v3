import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);

for (const name of ["functions/.env.local", ".env.local"]) {
  const envPath = path.join(root, name);
  if (!fs.existsSync(envPath)) continue;
  try {
    require("dotenv").config({ path: envPath });
  } catch {
    /* optional */
  }
}

export function resolveStorageBucket(serviceAccount) {
  const fromEnv = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  if (fromEnv) return fromEnv;

  const googleServicesPath = path.join(root, "assets", "google-services.json");
  if (fs.existsSync(googleServicesPath)) {
    const config = JSON.parse(fs.readFileSync(googleServicesPath, "utf8"));
    const bucket = config?.project_info?.storage_bucket;
    if (typeof bucket === "string" && bucket.trim()) {
      return bucket.trim();
    }
  }

  return `${serviceAccount.project_id ?? "into-the-pond"}.appspot.com`;
}

export function initFirebaseAdmin() {
  const functionsRequire = createRequire(path.join(root, "functions/package.json"));
  const { cert, initializeApp, getApps } = functionsRequire("firebase-admin/app");
  const { getFirestore } = functionsRequire("firebase-admin/firestore");
  const { getStorage } = functionsRequire("firebase-admin/storage");

  if (getApps().length === 0) {
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
    if (!keyPath) {
      throw new Error("Set FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env.local");
    }
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(root, keyPath);
    const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf8"));
    const storageBucket = resolveStorageBucket(serviceAccount);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id ?? "into-the-pond",
      storageBucket,
    });
  }

  return {
    db: getFirestore(),
    bucket: getStorage().bucket(),
    projectId: getApps()[0].options.projectId,
  };
}

export function buildDownloadUrl(bucketName, objectPath, token) {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}
