#!/usr/bin/env node
/**
 * Crops intrinsic slot PNGs from header_top_overlay for deliverables-aligned decoratives.
 * Run after updating the composite overlay art, then npm run sanctuary:process-header-assets.
 *
 * Usage: node scripts/extract_sanctuary_header_slots.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HEADER_DIR = path.join(ROOT, "assets/sanctuary/header");
const SOURCE = path.join(HEADER_DIR, "header_top_overlay.png");
const ORIGINALS = path.join(HEADER_DIR, "originals");

/** Crops on 1024×682 composite overlay (tune if overlay art changes). */
const CROPS = {
  month_note: { left: 36, top: 28, width: 210, height: 160 },
  wonder_bottle: { left: 768, top: 20, width: 220, height: 240 },
  botanical_overlay: { left: 0, top: 0, width: 1024, height: 240 },
};

const SETTINGS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="44" fill="none" stroke="#5B514A" stroke-width="3"/>
  <path fill="#5B514A" d="M48 22l4 10h11l-9 7 3 11-9-7-9 7 3-11-9-7h11zm0 28a8 8 0 1 0 0 16 8 8 0 0 0 0-16z"/>
</svg>`;

async function backupIfNeeded(filename) {
  const target = path.join(HEADER_DIR, filename);
  const backup = path.join(ORIGINALS, filename);
  try {
    await fs.access(backup);
  } catch {
    await fs.mkdir(ORIGINALS, { recursive: true });
    try {
      await fs.copyFile(target, backup);
      console.log(`   backed up → originals/${filename}`);
    } catch {
      /* new file */
    }
  }
}

async function cropSlot(name, region) {
  const out = path.join(HEADER_DIR, `${name}.png`);
  await backupIfNeeded(`${name}.png`);
  await sharp(SOURCE).extract(region).png({ compressionLevel: 9 }).toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`✓  ${name}.png → ${meta.width}×${meta.height}`);
}

async function writeSettingsGear() {
  const out = path.join(HEADER_DIR, "settings_button.png");
  await backupIfNeeded("settings_button.png");
  await sharp(Buffer.from(SETTINGS_SVG)).png({ compressionLevel: 9 }).toFile(out);
  console.log("✓  settings_button.png → 96×96 gear (generated)");
}

async function main() {
  try {
    await fs.access(SOURCE);
  } catch {
    console.error(`✗  Source not found: ${SOURCE}`);
    process.exit(1);
  }

  console.log(`   Extracting slot crops from ${path.relative(ROOT, SOURCE)}...\n`);
  for (const [name, region] of Object.entries(CROPS)) {
    await cropSlot(name, region);
  }
  await writeSettingsGear();
  console.log("\n✓  Done. Run: npm run sanctuary:process-header-assets");
}

main().catch((err) => {
  console.error("✗  Extract failed:", err.message);
  process.exit(1);
});
