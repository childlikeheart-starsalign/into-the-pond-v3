#!/usr/bin/env node
/**
 * Verifies Google Sign-In console/env prerequisites (no secrets printed).
 * Run after enabling Google provider and re-downloading google-services.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg) {
  console.error(`verify-google-signin-env: ${msg}`);
  process.exit(1);
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const env = { ...loadDotEnv(path.join(repoRoot, ".env.local")), ...loadDotEnv(path.join(repoRoot, ".env")) };
const webClientId = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "";

if (!webClientId) {
  fail("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID missing from .env — run: npm run setup:google-signin-env");
}
if (!webClientId.endsWith(".apps.googleusercontent.com")) {
  fail("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID does not look like a Web client ID");
}

const jsonPath = path.join(repoRoot, "assets", "google-services.json");
if (!fs.existsSync(jsonPath)) {
  fail("assets/google-services.json missing — download from Firebase Console after enabling Google sign-in");
}

let parsed;
try {
  parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
} catch {
  fail("assets/google-services.json is not valid JSON");
}

const oauthClients = (parsed.client ?? []).flatMap((c) => c.oauth_client ?? []);
const webFromJson = oauthClients.find((c) => String(c.client_type) === "3");
if (!webFromJson?.client_id) {
  fail(
    "google-services.json has no oauth_client with client_type 3 — enable Google in Firebase Auth and re-download the file",
  );
}

if (webFromJson.client_id !== webClientId) {
  fail(
    "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID does not match web client in google-services.json — run: npm run setup:google-signin-env",
  );
}

console.log("verify-google-signin-env: ok");
console.log("  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID set");
console.log("  google-services.json has oauth_client type 3");
console.log("  env matches downloaded config");
