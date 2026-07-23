#!/usr/bin/env node
/**
 * Sets EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env from assets/google-services.json
 * (oauth_client client_type 3). Does not print the client ID value.
 *
 * Prerequisite: Firebase Auth → Google enabled; fresh google-services.json downloaded.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(repoRoot, "assets", "google-services.json");
const envPath = path.join(repoRoot, ".env");

function fail(msg) {
  console.error(`setup-google-signin-env: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(jsonPath)) {
  fail("assets/google-services.json missing — download from Firebase Console first");
}

let parsed;
try {
  parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
} catch {
  fail("assets/google-services.json is not valid JSON");
}

const oauthClients = (parsed.client ?? []).flatMap((c) => c.oauth_client ?? []);
const webClient = oauthClients.find((c) => String(c.client_type) === "3");
if (!webClient?.client_id) {
  fail(
    "No web oauth_client (type 3) in google-services.json — enable Google sign-in in Firebase and re-download",
  );
}

const key = "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID";
const value = webClient.client_id;
const line = `${key}=${value}`;

let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const keyRe = new RegExp(`^${key}=.*$`, "m");

if (keyRe.test(envText)) {
  envText = envText.replace(keyRe, line);
  console.log("setup-google-signin-env: updated existing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env");
} else {
  if (envText.length > 0 && !envText.endsWith("\n")) envText += "\n";
  envText += `${line}\n`;
  console.log("setup-google-signin-env: appended EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env");
}

fs.writeFileSync(envPath, envText);
console.log("setup-google-signin-env: run npm run verify:google-signin-env to confirm");
