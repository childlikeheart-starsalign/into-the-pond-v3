const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const poolsDir = path.join(ROOT, "src", "data", "creatures");
const outPath = path.join(__dirname, "../src/sanctuary/creatureRefs.generated.ts");

const re =
  /creatureTypeId:\s*"([^"]+)".*?displayName:\s*"([^"]+)".*?poolTier:\s*"([^"]+)".*?elementType:\s*"([^"]+)".*?rodRequired:\s*"([^"]+)".*?peakWonderGate:\s*(\d+).*?sub_tier:\s*"([^"]+)"/gs;

const refs = [];
const poolFiles = fs
  .readdirSync(poolsDir)
  .filter((file) => file.startsWith("pool_") && file.endsWith(".ts"))
  .sort();

for (const file of poolFiles) {
  const src = fs.readFileSync(path.join(poolsDir, file), "utf8");
  for (const match of src.matchAll(re)) {
    refs.push({
      creatureTypeId: match[1],
      displayName: match[2],
      poolTier: match[3],
      elementType: match[4],
      rodRequired: match[5],
      peakWonderGate: Number(match[6]),
      sub_tier: match[7],
    });
  }
}

if (refs.length === 0) {
  throw new Error("generate-creature-refs: no creature refs extracted from pool files");
}

const creatureIds = refs.map((ref) => ref.creatureTypeId);
if (new Set(creatureIds).size !== creatureIds.length) {
  throw new Error("generate-creature-refs: duplicate creatureTypeId values in catalog");
}

const body = `// Auto-generated from src/data/creatures/pool_*.ts — do not edit by hand.
import type { CreatureRef } from "./encounterEngine";

export const CREATURE_REFS: CreatureRef[] = ${JSON.stringify(refs, null, 2)} as CreatureRef[];
`;

fs.writeFileSync(outPath, body);
console.log(`Wrote ${refs.length} creature refs to ${outPath}`);
