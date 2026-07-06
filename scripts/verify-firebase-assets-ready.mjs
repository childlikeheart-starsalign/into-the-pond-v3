#!/usr/bin/env node
/**
 * Verify local Firebase native assets exist and look configured (no secrets printed).
 * Run after downloading from Firebase Console / key rotation.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = "com.intothepond.app.v3";
const PLACEHOLDER_RE = /YOUR_|REPLACE_ME|placeholder/i;

const paths = {
  android: path.join(repoRoot, "assets", "google-services.json"),
  ios: path.join(repoRoot, "assets", "GoogleService-Info.plist"),
};

function fail(msg) {
  console.error(`verify-firebase-assets-ready: ${msg}`);
  process.exit(1);
}

function hasGoogleApiKeyShape(text) {
  return /AIzaSy[A-Za-z0-9_-]{33}/.test(text);
}

const errors = [];

if (!fs.existsSync(paths.android)) {
  errors.push("Missing assets/google-services.json");
} else {
  const raw = fs.readFileSync(paths.android, "utf8");
  if (PLACEHOLDER_RE.test(raw)) {
    errors.push("google-services.json still contains placeholder text");
  }
  try {
    const json = JSON.parse(raw);
    const pkg = json?.client?.[0]?.client_info?.android_client_info?.package_name;
    if (pkg !== PACKAGE) {
      errors.push(`google-services.json package_name is "${pkg}", expected ${PACKAGE}`);
    }
    const key = json?.client?.[0]?.api_key?.[0]?.current_key;
    if (!key || !hasGoogleApiKeyShape(key)) {
      errors.push("google-services.json missing valid current_key shape");
    }
  } catch {
    errors.push("google-services.json is not valid JSON");
  }
}

if (!fs.existsSync(paths.ios)) {
  errors.push("Missing assets/GoogleService-Info.plist");
} else {
  const raw = fs.readFileSync(paths.ios, "utf8");
  if (PLACEHOLDER_RE.test(raw)) {
    errors.push("GoogleService-Info.plist still contains placeholder text");
  }
  const bundleMatch = raw.match(/<key>BUNDLE_ID<\/key>\s*<string>([^<]+)<\/string>/);
  const bundle = bundleMatch?.[1];
  if (bundle !== PACKAGE) {
    errors.push(`plist BUNDLE_ID is "${bundle}", expected ${PACKAGE}`);
  }
  const keyMatch = raw.match(/<key>API_KEY<\/key>\s*<string>([^<]+)<\/string>/);
  if (!keyMatch?.[1] || !hasGoogleApiKeyShape(keyMatch[1])) {
    errors.push("GoogleService-Info.plist missing valid API_KEY shape");
  }
}

if (errors.length) {
  for (const e of errors) console.error(`  • ${e}`);
  fail("fix assets then run: npm run setup:eas-firebase-files");
}

console.log("verify-firebase-assets-ready: ok");
console.log(`  package/bundle: ${PACKAGE}`);
console.log("  Android + iOS native config files present and structurally valid");
console.log("  Next: restrict keys in GCP, disable old keys, npm run setup:eas-firebase-files");
