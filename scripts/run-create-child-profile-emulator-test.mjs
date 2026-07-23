#!/usr/bin/env node
/**
 * Runs createChildProfile emulator E2E (callable logic + real Firestore transactions).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function javaWorks(javaHome) {
  const javaBin = path.join(javaHome, "bin", "java");
  if (!fs.existsSync(javaBin)) return false;
  const result = spawnSync(javaBin, ["-version"], { encoding: "utf8" });
  return result.status === 0;
}

function resolveJavaHome() {
  if (process.env.JAVA_HOME && javaWorks(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }
  const candidates = [
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home",
    "/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
    "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home",
  ];
  for (const home of candidates) {
    if (javaWorks(home)) return home;
  }
  const javaVersion = spawnSync("java", ["-version"], { encoding: "utf8" });
  if (javaVersion.status === 0) return process.env.JAVA_HOME ?? null;
  return null;
}

const javaHome = resolveJavaHome();
if (!javaHome) {
  console.error("createChildProfile emulator tests require Java (Firebase emulator).");
  process.exit(1);
}

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  PATH: `${path.join(javaHome, "bin")}${path.delimiter}${process.env.PATH ?? ""}`,
  GCLOUD_PROJECT: "into-the-pond-child-profile-emu",
  GOOGLE_CLOUD_PROJECT: "into-the-pond-child-profile-emu",
  ACCOUNT_DELETION_SECRET: "test-account-deletion-secret",
  FUNCTIONS_EMULATOR: "true",
};

const cmd =
  'firebase emulators:exec --only firestore --project into-the-pond-child-profile-emu "node --import tsx functions/src/auth/createChildProfile.emulator.test.ts"';

const result = spawnSync(cmd, {
  cwd: REPO_ROOT,
  env,
  shell: true,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
