#!/usr/bin/env node
/**
 * Runs Realtime Database rules tests via the emulator.
 * Resolves JAVA_HOME when macOS /usr/bin/java is the unconfigured stub.
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
  if (javaVersion.status === 0) {
    return process.env.JAVA_HOME ?? null;
  }

  return null;
}

const javaHome = resolveJavaHome();
if (!javaHome) {
  console.error(
    "RTDB rules tests require Java (Firebase emulator).\n" +
      "Install: brew install openjdk@21\n" +
      "Then either export JAVA_HOME or re-run npm run test:rtdb-rules (auto-detects Homebrew JDK).",
  );
  process.exit(1);
}

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  PATH: `${path.join(javaHome, "bin")}${path.delimiter}${process.env.PATH ?? ""}`,
};

const cmd =
  'firebase emulators:exec --only database --project into-the-pond-rtdb-rules-test "node --import tsx --test tests/database.rules.test.ts"';

const result = spawnSync(cmd, {
  cwd: REPO_ROOT,
  env,
  shell: true,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
