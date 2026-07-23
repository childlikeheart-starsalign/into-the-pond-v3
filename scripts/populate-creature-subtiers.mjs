/**
 * Injects sub_tier from 05b-creature-subtiers.csv into src/data/creatures/pool_*.ts.
 * Usage: node scripts/populate-creature-subtiers.mjs [csvPath]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEFAULT_CSV = path.join(
  process.env.HOME ?? "",
  "Downloads",
  "Work Done",
  "05b-creature-subtiers.csv",
);
const csvPath = process.argv[2] ?? DEFAULT_CSV;
const poolsDir = path.join(ROOT, "src", "data", "creatures");

function parseCsvLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      result.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  result.push(cur);
  return result;
}

function normalizeSubTier(raw) {
  const t = raw.trim().toLowerCase();
  if (t.startsWith("uniform")) return "uniform";
  if (t === "common-rare" || t === "mid-rare" || t === "top-rare") return t;
  throw new Error(`Unknown sub_tier value: ${JSON.stringify(raw)}`);
}

const csv = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const header = parseCsvLine(csv[0]);
const idIdx = header.indexOf("creatureTypeId");
const subIdx = header.indexOf("sub_tier");
if (idIdx < 0 || subIdx < 0) {
  throw new Error("CSV missing creatureTypeId or sub_tier column");
}

/** @type {Map<string, string>} */
const subById = new Map();
for (const line of csv.slice(1)) {
  if (!line.trim()) continue;
  const cols = parseCsvLine(line);
  subById.set(cols[idIdx], normalizeSubTier(cols[subIdx]));
}

const poolFiles = fs
  .readdirSync(poolsDir)
  .filter((f) => f.startsWith("pool_") && f.endsWith(".ts"))
  .sort();

const seen = new Set();

for (const file of poolFiles) {
  const filePath = path.join(poolsDir, file);
  let src = fs.readFileSync(filePath, "utf8");

  // Strip any existing sub_tier lines so re-runs are idempotent
  src = src.replace(/\n\s*sub_tier:\s*"[^"]+",/g, "");

  src = src.replace(
    /creatureTypeId:\s*"([^"]+)"([\s\S]*?)peakWonderGate:\s*(\d+),/g,
    (_match, id, mid, gate) => {
      const sub = subById.get(id);
      if (!sub) {
        throw new Error(`${file}: no CSV sub_tier for ${id}`);
      }
      seen.add(id);
      return `creatureTypeId: "${id}"${mid}peakWonderGate: ${gate},\n    sub_tier: "${sub}",`;
    },
  );

  fs.writeFileSync(filePath, src);
}

const missing = [...subById.keys()].filter((id) => !seen.has(id));
if (missing.length > 0) {
  throw new Error(`CSV creatures not found in pool files: ${missing.join(", ")}`);
}
if (seen.size !== subById.size) {
  throw new Error(`Expected ${subById.size} creatures, seen ${seen.size}`);
}

console.log(`Populated sub_tier on ${seen.size} creatures across ${poolFiles.length} pool files`);
