/**
 * remove-black-bg.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts black-background images to true transparent PNGs (writes copies only).
 *
 * Usage:
 *   node scripts/remove-black-bg.js
 *   npm run auth:remove-black-bg
 *
 * Decode/encode uses sharp (already a devDependency). Some assets may use a .png
 * filename but contain JPEG data — pngjs-only pipelines fail on those; sharp handles both.
 *
 * Optional pngjs variant: if every input is a valid PNG, you could swap sharp for pngjs;
 * this repo keeps one robust path.
 *
 * How it works:
 *   Uses perceived brightness (luminance). If brightness <= THRESHOLD, alpha → 0.
 *   If FEATHER > 0, pixels between THRESHOLD and THRESHOLD+FEATHER fade in smoothly.
 *   Original files in assets/images/auth/ are not modified; outputs go to
 *   assets/images/auth/transparent/
 *
 * Tuning:
 *   - Raise THRESHOLD (e.g. 40–60) if faint dark halos remain after conversion.
 *   - Lower THRESHOLD (e.g. 10–15) if foreground pixels are accidentally erased.
 *   - Use FEATHER to softly fade near-black pixels instead of a hard cut.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");

// ── CONFIG ────────────────────────────────────────────────────────────────────

const INPUT_DIR = path.join(ROOT, "assets", "images", "auth");
const OUTPUT_DIR = path.join(ROOT, "assets", "images", "auth", "transparent");

/** Pixels at or below this luminance are treated as background (transparent). */
const THRESHOLD = 30;

/**
 * Pixels between THRESHOLD and THRESHOLD + FEATHER get partial alpha (soft edge).
 * Set to 0 for a hard cut.
 */
const FEATHER = 20;

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number} New alpha 0–255
 */
function computeAlpha(r, g, b) {
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

  if (brightness <= THRESHOLD) {
    return 0;
  }

  if (FEATHER > 0 && brightness <= THRESHOLD + FEATHER) {
    const ratio = (brightness - THRESHOLD) / FEATHER;
    return Math.round(ratio * 255);
  }

  return 255;
}

// ── CORE CONVERTER ────────────────────────────────────────────────────────────

/**
 * @param {string} inputPath
 * @param {string} outputPath
 */
async function convertImage(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 4) {
    throw new Error(`${inputPath}: expected 4 channels after ensureAlpha(), got ${info.channels}`);
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i + 3] = computeAlpha(r, g, b);
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`✓  ${path.basename(inputPath)} → transparent/${path.basename(outputPath)}`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`✗  Input directory not found: ${INPUT_DIR}`);
    console.error("   Create the folder and place your images inside it.");
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`   Created output directory: ${OUTPUT_DIR}\n`);
  }

  const files = fs
    .readdirSync(INPUT_DIR, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".png"))
    .map((d) => d.name);

  if (files.length === 0) {
    console.warn("⚠  No .png files found in", INPUT_DIR);
    process.exit(0);
  }

  console.log(`   Found ${files.length} file(s). Converting (sharp → RGBA PNG)...\n`);

  try {
    for (const filename of files) {
      const inputPath = path.join(INPUT_DIR, filename);
      const outputPath = path.join(OUTPUT_DIR, filename);
      await convertImage(inputPath, outputPath);
    }
    console.log(`\n✓  Done. Transparent PNGs saved to:\n   ${OUTPUT_DIR}`);
  } catch (err) {
    console.error("\n✗  Conversion failed:", err.message);
    process.exit(1);
  }
}

main();
