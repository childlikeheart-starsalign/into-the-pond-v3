#!/usr/bin/env node
/**
 * Writes Firebase native config files from EAS env secrets before `expo prebuild`.
 * Expects base64-encoded env vars (set via `npm run setup:eas-firebase-files`):
 *   - GOOGLE_SERVICE_INFO_PLIST_BASE64
 *   - GOOGLE_SERVICES_JSON_BASE64
 *
 * Local dev: if env vars are absent, existing files under assets/ are left unchanged.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(repoRoot, "assets");

const TARGETS = [
  {
    envKey: "GOOGLE_SERVICE_INFO_PLIST_BASE64",
    dest: path.join(assetsDir, "GoogleService-Info.plist"),
    label: "GoogleService-Info.plist",
  },
  {
    envKey: "GOOGLE_SERVICES_JSON_BASE64",
    dest: path.join(assetsDir, "google-services.json"),
    label: "google-services.json",
  },
];

function writeFromBase64(envKey, dest, label) {
  const encoded = process.env[envKey];
  if (!encoded) {
    if (fs.existsSync(dest)) {
      console.log(`write-firebase-native-files: ${label} — using existing local file`);
      return "local";
    }
    console.warn(`write-firebase-native-files: ${envKey} unset and ${label} missing — skipping`);
    return "skipped";
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(encoded, "base64"));
  console.log(`write-firebase-native-files: wrote ${label} from ${envKey}`);
  return "written";
}

let wrote = 0;
for (const target of TARGETS) {
  const result = writeFromBase64(target.envKey, target.dest, target.label);
  if (result === "written") wrote += 1;
}

if (wrote === 0 && !fs.existsSync(path.join(assetsDir, "GoogleService-Info.plist"))) {
  console.warn(
    "write-firebase-native-files: no iOS plist available — native Firebase iOS will be skipped at prebuild",
  );
}
