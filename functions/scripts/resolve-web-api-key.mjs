#!/usr/bin/env node
/**
 * Resolve web API key via Firebase CLI sdkconfig (stdout only the key).
 * Does not log the key.
 */
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "npx",
  ["firebase-tools", "apps:sdkconfig", "WEB", "--project", "into-the-pond"],
  { encoding: "utf8", shell: process.platform === "win32" },
);
const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
const match = out.match(/"apiKey":\s*"([^"]+)"/);
if (!match) {
  process.stderr.write("Could not resolve web apiKey from apps:sdkconfig\n");
  process.exit(2);
}
process.stdout.write(match[1]);
