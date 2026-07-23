#!/usr/bin/env node
/**
 * Automated checks for Audio + PostHog device QA plan (Part A wiring + Part B event contracts).
 * Run: node scripts/verify-fishing-ceremony-qa.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const audioDir = path.join(repoRoot, "assets/audio/fishing");
const manifestPath = path.join(
  repoRoot,
  "docs/handoff/Oscar/deliverables/01-audio-manifest.csv",
);
const sanctuaryPath = path.join(repoRoot, "app/(tabs)/sanctuary.tsx");

const EXPECTED_MP3 = [
  "cast-splash.mp3",
  "pond-waiting-ambient.mp3",
  "claim-catch.mp3",
  "claim-duplicate.mp3",
  "claim-miss-chance.mp3",
  "claim-miss-wonder-gate.mp3",
  "craft-begin.mp3",
  "craft-ready.mp3",
  "craft-equip.mp3",
];

const failures = [];

function pass(label) {
  console.log(`PASS  ${label}`);
}

function fail(label, detail) {
  failures.push(`${label}: ${detail}`);
  console.error(`FAIL  ${label}: ${detail}`);
}

function checkAudioAssets() {
  console.log("\n## Audio assets");
  if (!fs.existsSync(audioDir)) {
    fail("audio directory", `missing ${audioDir}`);
    return;
  }
  for (const file of EXPECTED_MP3) {
    const full = path.join(audioDir, file);
    if (!fs.existsSync(full)) {
      fail(file, "missing");
      continue;
    }
    const size = fs.statSync(full).size;
    if (size <= 0) {
      fail(file, "empty file");
      continue;
    }
    pass(`${file} (${size} bytes)`);
  }

  if (fs.existsSync(manifestPath)) {
    const manifest = fs.readFileSync(manifestPath, "utf8");
    for (const file of EXPECTED_MP3) {
      if (!manifest.includes(file)) {
        fail("manifest", `${file} not listed in 01-audio-manifest.csv`);
      }
    }
    pass("manifest lists all 9 fishing MP3s");
  }
}

function checkSanctuaryWiring() {
  console.log("\n## Sanctuary cast/claim wiring");
  const src = fs.readFileSync(sanctuaryPath, "utf8");
  const checks = [
    ['fishingSounds.play("castSplash")', "cast splash on accept"],
    ['fishingSounds.play("pondWaitingAmbient")', "pond ambient on accept"],
    ["fishingSounds.stopAmbient()", "ambient stop on claim"],
    ["fishingSounds.playClaimOutcome(completedClaim)", "claim outcome SFX on resolve"],
    ["trackFishingClaimResolved(", "PostHog fishing_claim_resolved"],
    ["trackPondRippleComplete(", "PostHog pond_ripple_complete"],
    ["trackClaimCelebrationDismissed(", "PostHog claim_celebration_dismissed"],
    ["shouldShowCatalogRarityRingOverlay", "ring overlay helper"],
    ["canPresentClaimCeremony", "curtain presentation gate"],
    ["claimPresentationId", "presentation-scoped ceremony id"],
    ["shouldPlayRingForPresentation", "presentation-scoped ring dedupe"],
    ["useActiveCastContext", "tabs-shell ActiveCastProvider"],
    ["ringUiEnabled: true", "always-on ring analytics"],
  ];
  for (const [needle, label] of checks) {
    if (!src.includes(needle)) {
      fail(label, `expected ${needle} in sanctuary.tsx`);
    } else {
      pass(label);
    }
  }
}

function runNodeTests() {
  console.log("\n## PostHog event contract tests");
  const result = spawnSync(
    "node",
    [
      "--experimental-test-module-mocks",
      "--import",
      "tsx",
      "--test",
      "src/services/analytics/fishingClaimEvents.node.test.ts",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  );
  if (result.status !== 0) {
    fail("fishingClaimEvents.node.test.ts", result.stderr || result.stdout || "non-zero exit");
    return;
  }
  pass("fishingClaimEvents.node.test.ts");
}

function runSmokeClaimCast() {
  console.log("\n## Live claim smoke (backend)");
  const result = spawnSync("npm", ["run", "smoke:claim-cast"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(out);
  if (result.status !== 0 || !out.includes("SMOKE PASS")) {
    fail("smoke:claim-cast", "did not report SMOKE PASS");
    return;
  }
  const outcomeMatch = out.match(/outcome = (\w+)/);
  pass(`smoke:claim-cast (outcome=${outcomeMatch?.[1] ?? "unknown"})`);
}

checkAudioAssets();
checkSanctuaryWiring();
runNodeTests();
runSmokeClaimCast();

console.log("\n---");
if (failures.length) {
  console.error(`${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("All automated fishing ceremony QA checks passed.");
