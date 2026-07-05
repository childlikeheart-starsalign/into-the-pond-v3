#!/usr/bin/env node
/**
 * One-time split of creatures150.ts into src/data/creatures/ pool files.
 * Run: node scripts/split-creature-catalog.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "src/features/creatures/creatures150.ts");
const outDir = path.join(root, "src/data/creatures");

const source = fs.readFileSync(sourcePath, "utf8");
const lines = source.split("\n");

const typesStart = lines.findIndex((l) => l.startsWith("export type ElementType"));
const typesEnd = lines.findIndex((l) => l.startsWith("// ─── CATALOG"));
const typesBlock = lines.slice(typesStart, typesEnd).join("\n");

const arrayStart = lines.findIndex((l) => l.startsWith("export const CREATURES"));
let arrayEnd = -1;
for (let i = arrayStart + 1; i < lines.length; i++) {
  if (lines[i].trim() === "];") {
    arrayEnd = i;
    break;
  }
}
const helpersStart = lines.findIndex((l) => l.includes("HELPER FUNCTIONS"));

const poolSections = [
  { file: "pool_basic.ts", exportName: "pool_basic", marker: "// COMMON POOL" },
  { file: "pool_rare_fire.ts", exportName: "pool_rare_fire", marker: "// RARE FIRE" },
  { file: "pool_rare_water.ts", exportName: "pool_rare_water", marker: "// RARE WATER" },
  { file: "pool_rare_wind.ts", exportName: "pool_rare_wind", marker: "// RARE WIND" },
  { file: "pool_rare_electric.ts", exportName: "pool_rare_electric", marker: "// RARE ELECTRIC" },
  { file: "pool_rare_wildcard.ts", exportName: "pool_rare_wildcard", marker: "// RARE ANY-ELEMENT" },
  { file: "pool_epic_fire.ts", exportName: "pool_epic_fire", marker: "// EPIC FIRE" },
  { file: "pool_epic_water.ts", exportName: "pool_epic_water", marker: "// EPIC WATER" },
  { file: "pool_epic_wind.ts", exportName: "pool_epic_wind", marker: "// EPIC WIND" },
  { file: "pool_epic_electric.ts", exportName: "pool_epic_electric", marker: "// EPIC ELECTRIC" },
];

const markerLines = poolSections.map((s) => ({
  ...s,
  lineIndex: lines.findIndex((l) => l.includes(s.marker)),
}));

for (let i = 0; i < markerLines.length; i++) {
  const section = markerLines[i];
  const nextLine = i + 1 < markerLines.length ? markerLines[i + 1].lineIndex : arrayEnd;
  // Skip comment block (3-4 lines) to first `{`
  let start = section.lineIndex;
  while (start < nextLine && !lines[start].trim().startsWith("{")) start += 1;
  let end = nextLine - 1;
  while (end > start && lines[end].trim() === "") end -= 1;
  if (lines[end].trim() === "}," || lines[end].trim() === "}") {
    // keep
  } else if (lines[end].trim().endsWith("},")) {
    // keep
  }
  const body = lines.slice(start, end + 1).join("\n");
  section.content = body;
  section.count = (body.match(/creatureTypeId:/g) || []).length;
}

fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "types.ts"),
  `${typesBlock.trim()}\n`,
  "utf8",
);

for (const section of markerLines) {
  const content = `import type { Creature } from "./types";

export const ${section.exportName}: Creature[] = [
${section.content}
];
`;
  fs.writeFileSync(path.join(outDir, section.file), content, "utf8");
  console.log(`${section.file}: ${section.count} creatures`);
}

const helpersBlock = lines.slice(helpersStart + 1).join("\n");
// Replace CREATURES-based POOL and CREATURE_BY_ID with imports from pools
const helpersWithoutDerived = helpersBlock
  .replace(/^export const CREATURE_BY_ID[\s\S]*?^};\n\n/m, "")
  .replace(/^export const POOL[\s\S]*?^};\n\n/m, "")
  .replace(
    "CREATURES.length",
    "Object.values(POOL).reduce((n, p) => n + p.length, 0)",
  );

const helpersContent = `import type { Creature, ElementType, PoolTier } from "./types";
import { ENCOUNTER_RATES, DUPLICATE_CONSOLATION, MISS_CONSOLATION } from "./types";
import { pool_basic } from "./pool_basic";
import { pool_rare_fire } from "./pool_rare_fire";
import { pool_rare_water } from "./pool_rare_water";
import { pool_rare_wind } from "./pool_rare_wind";
import { pool_rare_electric } from "./pool_rare_electric";
import { pool_rare_wildcard } from "./pool_rare_wildcard";
import { pool_epic_fire } from "./pool_epic_fire";
import { pool_epic_water } from "./pool_epic_water";
import { pool_epic_wind } from "./pool_epic_wind";
import { pool_epic_electric } from "./pool_epic_electric";

export const POOL = {
  common: pool_basic,
  rarefire: pool_rare_fire,
  rarewater: pool_rare_water,
  rarewind: pool_rare_wind,
  rareelectric: pool_rare_electric,
  rareany: pool_rare_wildcard,
  epicfire: pool_epic_fire,
  epicwater: pool_epic_water,
  epicwind: pool_epic_wind,
  epicelectric: pool_epic_electric,
};

${helpersWithoutDerived.trim()}
`;

fs.writeFileSync(path.join(outDir, "helpers.ts"), helpersContent, "utf8");

const indexContent = `export * from "./types";
export { pool_basic } from "./pool_basic";
export { pool_rare_fire } from "./pool_rare_fire";
export { pool_rare_water } from "./pool_rare_water";
export { pool_rare_wind } from "./pool_rare_wind";
export { pool_rare_electric } from "./pool_rare_electric";
export { pool_rare_wildcard } from "./pool_rare_wildcard";
export { pool_epic_fire } from "./pool_epic_fire";
export { pool_epic_water } from "./pool_epic_water";
export { pool_epic_wind } from "./pool_epic_wind";
export { pool_epic_electric } from "./pool_epic_electric";
export { POOL, validatePoolCounts, selectCandidate, catchChance, consolationReward } from "./helpers";
export { pool_basic as pool_common } from "./pool_basic";

import { pool_basic } from "./pool_basic";
import { pool_rare_fire } from "./pool_rare_fire";
import { pool_rare_water } from "./pool_rare_water";
import { pool_rare_wind } from "./pool_rare_wind";
import { pool_rare_electric } from "./pool_rare_electric";
import { pool_rare_wildcard } from "./pool_rare_wildcard";
import { pool_epic_fire } from "./pool_epic_fire";
import { pool_epic_water } from "./pool_epic_water";
import { pool_epic_wind } from "./pool_epic_wind";
import { pool_epic_electric } from "./pool_epic_electric";
import type { Creature } from "./types";

export const CREATURES: Creature[] = [
  ...pool_basic,
  ...pool_rare_fire,
  ...pool_rare_water,
  ...pool_rare_wind,
  ...pool_rare_electric,
  ...pool_rare_wildcard,
  ...pool_epic_fire,
  ...pool_epic_water,
  ...pool_epic_wind,
  ...pool_epic_electric,
];

export const CREATURE_BY_ID = Object.fromEntries(
  CREATURES.map((c) => [c.creatureTypeId, c]),
) as Record<string, Creature>;
`;

fs.writeFileSync(path.join(outDir, "index.ts"), indexContent, "utf8");

const total = markerLines.reduce((sum, s) => sum + s.count, 0);
console.log(`Total creatures: ${total}`);
