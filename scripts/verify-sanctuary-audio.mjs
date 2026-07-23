#!/usr/bin/env node
/**
 * Automated checks for sanctuary theme + closing journal audio wiring.
 * Run: npm run verify:sanctuary-audio
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const audioRoot = path.join(repoRoot, "assets/audio");
const manifestPath = path.join(
  repoRoot,
  "docs/handoff/Oscar/deliverables/01-audio-manifest.csv",
);
const mediaPath = path.join(repoRoot, "src/constants/media.ts");
const curtainPath = path.join(repoRoot, "src/contexts/CurtainLiftContext.tsx");
const ritualPath = path.join(repoRoot, "src/components/diary/DiaryRitualFlow.tsx");
const diaryPath = path.join(repoRoot, "screens/DiaryEntryScreen.tsx");
const sanctuaryPath = path.join(repoRoot, "app/(tabs)/sanctuary.tsx");
const rootLayoutPath = path.join(repoRoot, "app/_layout.tsx");

const playerPath = path.join(repoRoot, "src/services/audio/eveningPondPlayer.ts");
const sessionContextPath = path.join(repoRoot, "src/contexts/EveningPondSessionContext.tsx");
const sessionRoutesPath = path.join(repoRoot, "src/services/audio/eveningPondSessionRoutes.ts");
const focusedAmbientPath = path.join(repoRoot, "src/hooks/useFocusedEveningPondAmbient.ts");

const middleStepsHookPath = path.join(
  repoRoot,
  "src/hooks/useDiaryRitualMiddleAmbientSound.ts",
);

const gateIndexPath = path.join(repoRoot, "app/index.tsx");
const optionalSourcesPath = path.join(repoRoot, "src/services/audio/optionalAudioSources.ts");
const signInArrivalPath = path.join(repoRoot, "src/contexts/SignInArrivalContext.tsx");
const loginPath = path.join(repoRoot, "app/(auth)/login.tsx");
const signupPath = path.join(repoRoot, "app/(auth)/signup.tsx");
const createProfilePath = path.join(
  repoRoot,
  "src/features/childProfile/CreateChildProfileScreen.tsx",
);
const gateAmbientHookPath = path.join(repoRoot, "src/hooks/useGateAmbientSound.ts");

const SANCTUARY_AUDIO = [
  "sanctuary-theme.mp3",
  "closing-the-journal.mp3",
  "evening-pond.mp3",
  "diary-ritual-middle-steps.mp3",
];

const failures = [];

function pass(label) {
  console.log(`PASS  ${label}`);
}

function fail(label, detail) {
  failures.push(`${label}: ${detail}`);
  console.error(`FAIL  ${label}: ${detail}`);
}

function fileMustNotInclude(relPath, needle) {
  const full = path.join(repoRoot, relPath);
  if (!fs.existsSync(full)) return;
  if (fs.readFileSync(full, "utf8").includes(needle)) {
    fail(relPath, `must not use ${needle} (pond session is centralized)`);
  } else {
    pass(`${relPath} → no ${needle}`);
  }
}

console.log("\n## Sanctuary audio assets");
for (const file of SANCTUARY_AUDIO) {
  const full = path.join(audioRoot, file);
  if (!fs.existsSync(full)) {
    fail(file, "missing");
    continue;
  }
  const size = fs.statSync(full).size;
  if (size <= 0) {
    fail(file, "empty");
    continue;
  }
  pass(`${file} (${size} bytes)`);
  if (file === "sanctuary-theme.mp3" && size > 2_000_000) {
    console.warn(
      `WARN  sanctuary-theme.mp3 is ${Math.round(size / 1024 / 1024)}MB — consider trimming to 30–45s loop`,
    );
  }
  if (file === "evening-pond.mp3" && size > 2_000_000) {
    console.warn(
      `WARN  evening-pond.mp3 is ${Math.round(size / 1024 / 1024)}MB — consider trimming to 90–120s loop`,
    );
  }
}

if (fs.existsSync(manifestPath)) {
  const manifest = fs.readFileSync(manifestPath, "utf8");
  for (const file of SANCTUARY_AUDIO) {
    if (!manifest.includes(file)) {
      fail("manifest", `${file} not in 01-audio-manifest.csv`);
    }
  }
  pass("manifest lists sanctuary + closing journal + evening pond");
}

console.log("\n## Wiring");
const media = fs.readFileSync(mediaPath, "utf8");
for (const needle of ["sanctuaryTheme", "closingTheJournal", "eveningPond", "diaryRitualMiddleSteps"]) {
  if (!media.includes(needle)) fail("media.ts", `missing ${needle}`);
  else pass(`media.ts → ${needle}`);
}

const curtain = fs.readFileSync(curtainPath, "utf8");
for (const needle of [
  "maybePlaySanctuaryFirstRevealTheme",
  "stopSanctuaryFirstRevealTheme",
]) {
  if (!curtain.includes(needle)) fail("CurtainLiftContext", `missing ${needle}`);
  else pass(`CurtainLiftContext → ${needle}`);
}

if (!fs.readFileSync(ritualPath, "utf8").includes("playClosingTheJournal")) {
  fail("DiaryRitualFlow", "missing playClosingTheJournal");
} else {
  pass("DiaryRitualFlow → playClosingTheJournal");
}

if (!fs.readFileSync(diaryPath, "utf8").includes("playClosingTheJournal")) {
  fail("DiaryEntryScreen", "missing playClosingTheJournal");
} else {
  pass("DiaryEntryScreen → playClosingTheJournal");
}

const player = fs.readFileSync(playerPath, "utf8");
if (!player.includes("media.audio.eveningPond")) {
  fail("eveningPondPlayer", "missing media.audio.eveningPond");
} else {
  pass("eveningPondPlayer → eveningPond loop");
}
if (!player.includes("setEveningPondPlayback")) {
  fail("eveningPondPlayer", "missing setEveningPondPlayback");
} else {
  pass("eveningPondPlayer → setEveningPondPlayback API");
}
if (!player.includes("pauseAsync")) {
  fail("eveningPondPlayer", "missing pauseAsync for soft mutes");
} else {
  pass("eveningPondPlayer → pauseAsync soft mute");
}

const sessionContext = fs.readFileSync(sessionContextPath, "utf8");
if (!sessionContext.includes("EveningPondSessionController")) {
  fail("EveningPondSessionContext", "missing EveningPondSessionController");
} else {
  pass("EveningPondSessionContext → controller");
}

const rootLayout = fs.readFileSync(rootLayoutPath, "utf8");
if (!rootLayout.includes("EveningPondSessionProvider")) {
  fail("app/_layout.tsx", "missing EveningPondSessionProvider");
} else {
  pass("app/_layout.tsx → EveningPondSessionProvider");
}
if (!rootLayout.includes("EveningPondSessionController")) {
  fail("app/_layout.tsx", "missing EveningPondSessionController");
} else {
  pass("app/_layout.tsx → EveningPondSessionController");
}

if (!fs.existsSync(sessionRoutesPath)) {
  fail("eveningPondSessionRoutes", "missing file");
} else {
  pass("eveningPondSessionRoutes.ts exists");
}

if (fs.existsSync(focusedAmbientPath)) {
  fail("useFocusedEveningPondAmbient", "deprecated per-screen hook should be removed");
} else {
  pass("useFocusedEveningPondAmbient removed");
}

if (!fs.readFileSync(ritualPath, "utf8").includes("useEveningPondSuppression")) {
  fail("DiaryRitualFlow", "missing useEveningPondSuppression");
} else {
  pass("DiaryRitualFlow → useEveningPondSuppression");
}

const middleStepsHook = fs.readFileSync(middleStepsHookPath, "utf8");
if (!middleStepsHook.includes("media.audio.diaryRitualMiddleSteps")) {
  fail("useDiaryRitualMiddleAmbientSound", "missing media.audio.diaryRitualMiddleSteps");
} else {
  pass("useDiaryRitualMiddleAmbientSound → diaryRitualMiddleSteps loop");
}
if (!middleStepsHook.includes("pauseAsync") || !middleStepsHook.includes("fadeVolume")) {
  fail("useDiaryRitualMiddleAmbientSound", "expected pauseAsync + fadeVolume for smooth handoff");
} else {
  pass("useDiaryRitualMiddleAmbientSound → pause + fade handoff");
}

if (!fs.readFileSync(ritualPath, "utf8").includes("useDiaryRitualMiddleAmbientSound")) {
  fail("DiaryRitualFlow", "missing useDiaryRitualMiddleAmbientSound");
} else {
  pass("DiaryRitualFlow → useDiaryRitualMiddleAmbientSound");
}

console.log("\n## Pond session suppressions");
const sanctuary = fs.readFileSync(sanctuaryPath, "utf8");
if (!sanctuary.includes('useEveningPondSuppression("sanctuary-cast"')) {
  fail("sanctuary.tsx", "missing sanctuary-cast stop suppression");
} else {
  pass("sanctuary.tsx → cast hard-stop suppression");
}
if (!sanctuary.includes('kind: "stop"') || !sanctuary.includes("isCasting")) {
  fail("sanctuary.tsx", "missing isCasting hard-stop");
} else {
  pass("sanctuary.tsx → stops evening pond while casting");
}
if (!sanctuary.includes('kind: "pause"')) {
  fail("sanctuary.tsx", "missing pause suppressions for claim/modal");
} else {
  pass("sanctuary.tsx → pause on claim / fishing modal");
}

console.log("\n## No per-screen focus ambient hooks");
for (const relPath of [
  "app/(tabs)/store.tsx",
  "app/(tabs)/net.tsx",
  "src/features/classroom/ClassroomScreen.tsx",
  "src/features/gate/GateScreen.tsx",
  "src/features/craftBench/CraftBenchScreen.tsx",
  "src/features/well/WellModalContent.tsx",
  "src/features/sanctuary/PracticeMomentScreen.tsx",
  "screens/DiaryEntryScreen.tsx",
]) {
  fileMustNotInclude(relPath, "useFocusedEveningPondAmbient");
}

console.log("\n## Storage unit test");
const result = spawnSync(
  "node",
  [
    "--experimental-test-module-mocks",
    "--import",
    "tsx",
    "--test",
    "src/services/onboarding/sanctuaryThemeStorage.test.ts",
  ],
  { cwd: repoRoot, encoding: "utf8" },
);
if (result.status !== 0) {
  fail("sanctuaryThemeStorage.test.ts", result.stderr || result.stdout || "non-zero exit");
} else {
  pass("sanctuaryThemeStorage.test.ts");
}

console.log("\n## Gate + recycled auth/profile audio");
const gateUnlockPath = path.join(audioRoot, "gate-unlock.mp4");
if (!fs.existsSync(gateUnlockPath)) {
  fail("gate-unlock.mp4", "missing");
} else {
  pass(`gate-unlock.mp4 (${fs.statSync(gateUnlockPath).size} bytes)`);
}

if (!fs.existsSync(optionalSourcesPath)) {
  fail("optionalAudioSources.ts", "missing");
} else {
  const optionalSources = fs.readFileSync(optionalSourcesPath, "utf8");
  for (const needle of [
    "gateAmbient:",
    "authWelcome:",
    "authSoftDeny:",
    "profilePlanted:",
    "evening-pond.mp3",
    "open-book.mp3",
    "claim-miss-wonder-gate.mp3",
    "closing-the-journal.mp3",
  ]) {
    if (!optionalSources.includes(needle)) {
      fail("optionalAudioSources.ts", `missing ${needle}`);
    } else {
      pass(`optionalAudioSources.ts → ${needle}`);
    }
  }
}

const gateIndex = fs.existsSync(gateIndexPath)
  ? fs.readFileSync(gateIndexPath, "utf8")
  : "";
if (!gateIndex.includes("playGateUnlock")) {
  fail("app/index.tsx", "missing playGateUnlock");
} else {
  pass("app/index.tsx → playGateUnlock");
}
if (!gateIndex.includes("useGateAmbientSound")) {
  fail("app/index.tsx", "missing useGateAmbientSound");
} else {
  pass("app/index.tsx → useGateAmbientSound");
}

if (fs.existsSync(sessionRoutesPath)) {
  const routes = fs.readFileSync(sessionRoutesPath, "utf8");
  if (!routes.includes('"/folio"')) {
    fail("eveningPondSessionRoutes", 'missing "/folio"');
  } else {
    pass('eveningPondSessionRoutes → "/folio"');
  }
}

if (fs.existsSync(signInArrivalPath)) {
  const arrival = fs.readFileSync(signInArrivalPath, "utf8");
  if (!arrival.includes("playAuthWelcome")) {
    fail("SignInArrivalContext", "missing playAuthWelcome");
  } else {
    pass("SignInArrivalContext → playAuthWelcome");
  }
}

for (const [relPath, needles] of [
  ["app/(auth)/login.tsx", ["useAuthSoftDenyOnError", "playAuthSoftDeny"]],
  ["app/(auth)/signup.tsx", ["useAuthSoftDenyOnError", "playAuthWelcome"]],
]) {
  const full = path.join(repoRoot, relPath);
  if (!fs.existsSync(full)) {
    fail(relPath, "missing");
    continue;
  }
  const content = fs.readFileSync(full, "utf8");
  for (const needle of needles) {
    if (!content.includes(needle)) {
      fail(relPath, `missing ${needle}`);
    } else {
      pass(`${relPath} → ${needle}`);
    }
  }
}

if (fs.existsSync(createProfilePath)) {
  const profile = fs.readFileSync(createProfilePath, "utf8");
  if (!profile.includes("playProfilePlanted")) {
    fail("CreateChildProfileScreen", "missing playProfilePlanted");
  } else {
    pass("CreateChildProfileScreen → playProfilePlanted");
  }
}

if (fs.existsSync(gateAmbientHookPath)) {
  const hook = fs.readFileSync(gateAmbientHookPath, "utf8");
  if (!hook.includes("optionalAudioSources.gateAmbient")) {
    fail("useGateAmbientSound", "missing optionalAudioSources.gateAmbient");
  } else {
    pass("useGateAmbientSound → gateAmbient source");
  }
}

console.log("\n## Persistent tab bar (no sanctuary flicker)");
const illustratedTabBarPath = path.join(repoRoot, "src/components/navigation/IllustratedTabBar.tsx");
const sanctuaryScreenPath = path.join(repoRoot, "src/components/sanctuary/SanctuaryScreen.tsx");
if (fs.existsSync(illustratedTabBarPath)) {
  const tabBar = fs.readFileSync(illustratedTabBarPath, "utf8");
  if (tabBar.includes("if (onSanctuary)")) {
    fail("IllustratedTabBar", "must not unmount on sanctuary (causes nav flicker)");
  } else {
    pass("IllustratedTabBar → persistent on sanctuary");
  }
  if (!tabBar.includes("SanctuaryTabBarOverlay")) {
    fail("IllustratedTabBar", "missing SanctuaryTabBarOverlay");
  } else {
    pass("IllustratedTabBar → SanctuaryTabBarOverlay");
  }
}
if (fs.existsSync(sanctuaryScreenPath)) {
  const sanctuaryScreen = fs.readFileSync(sanctuaryScreenPath, "utf8");
  if (sanctuaryScreen.includes("<SanctuaryNavBar")) {
    fail("SanctuaryScreen", "embedded SanctuaryNavBar causes duplicate nav flicker");
  } else {
    pass("SanctuaryScreen → no embedded SanctuaryNavBar");
  }
}

const paperClickPlayerPath = path.join(repoRoot, "src/services/audio/playPaperClick.ts");
const paperClickAudioPath = path.join(repoRoot, "src/constants/paperClickAudio.ts");
const uiAudioRoot = path.join(audioRoot, "ui");

console.log("\n## Paper click UI SFX");
for (const file of ["click-paper-1.mp3", "click-paper-2.mp3", "click-paper-3.mp3"]) {
  const full = path.join(uiAudioRoot, file);
  if (!fs.existsSync(full)) {
    fail(file, "missing under assets/audio/ui/");
  } else {
    pass(`${file} (${fs.statSync(full).size} bytes)`);
  }
}

if (!fs.existsSync(paperClickPlayerPath)) {
  fail("playPaperClick.ts", "missing");
} else {
  const player = fs.readFileSync(paperClickPlayerPath, "utf8");
  if (!player.includes("nextIndex") || !player.includes("0.18")) {
    fail("playPaperClick.ts", "expected round-robin nextIndex + volume 0.18");
  } else {
    pass("playPaperClick.ts → round-robin @ 0.18");
  }
}

if (!fs.existsSync(paperClickAudioPath)) {
  fail("paperClickAudio.ts", "missing");
} else {
  pass("paperClickAudio.ts → 3 click sources");
}

const diarySingleSelectPath = path.join(repoRoot, "src/components/diary/DiarySingleSelect.tsx");
const navBarPath = path.join(repoRoot, "src/components/sanctuary/SanctuaryNavBar.tsx");
for (const [relPath, needle] of [
  [diarySingleSelectPath, "playPaperClick"],
  [navBarPath, "playPaperClick"],
  [ritualPath, "playPaperClick"],
]) {
  const label = path.relative(repoRoot, relPath);
  if (!fs.existsSync(relPath)) {
    fail(label, "missing");
  } else if (!fs.readFileSync(relPath, "utf8").includes(needle)) {
    fail(label, `missing ${needle}`);
  } else {
    pass(`${label} → ${needle}`);
  }
}

console.log("\n---");
if (failures.length) {
  console.error(`${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("All sanctuary audio checks passed.");
