#!/usr/bin/env node
/**
 * Converts near-black and near-white pixels to transparent alpha for header PNGs.
 * Input may be JPEG data with a .png extension — sharp handles both.
 *
 * Usage:
 *   node scripts/process_sanctuary_header_assets.mjs
 *   npm run sanctuary:process-header-assets
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HEADER_DIR = path.join(ROOT, "assets/sanctuary/header");
const ORIGINALS_DIR = path.join(HEADER_DIR, "originals");

/** Pixels at or below this luminance become transparent (black key). */
const BLACK_THRESHOLD = 30;

/** Soft edge between BLACK_THRESHOLD and BLACK_THRESHOLD + BLACK_FEATHER. */
const BLACK_FEATHER = 20;

/** Pixels at or above this luminance become transparent (global white key). */
const WHITE_THRESHOLD = 245;

/** Soft edge between WHITE_THRESHOLD - WHITE_FEATHER and WHITE_THRESHOLD. */
const WHITE_FEATHER = 15;

/** Files that need global white-background removal (full-artboard florals). */
const WHITE_KEY_FILES = new Set(["botanical_overlay.png", "New-botanical_overlay.png"]);

/**
 * Files where only edge-connected near-pure-white matte should be removed.
 * Keeps interior parchment, avatar hole, and note paper fully opaque.
 */
const EDGE_WHITE_MATTE_FILES = new Set(["header_illustration_strip.png"]);

/** Edge matte: luminance at or above this value, and near-neutral. */
const EDGE_MATTE_LUMINANCE = 254;

/** Max RGB channel spread for matte pixels (rejects tinted parchment). */
const EDGE_MATTE_CHROMA = 12;

function computeBlackKeyAlpha(r, g, b) {
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  if (brightness <= BLACK_THRESHOLD) return 0;
  if (BLACK_FEATHER > 0 && brightness <= BLACK_THRESHOLD + BLACK_FEATHER) {
    return Math.round(((brightness - BLACK_THRESHOLD) / BLACK_FEATHER) * 255);
  }
  return 255;
}

function computeWhiteKeyAlpha(r, g, b) {
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  if (brightness >= WHITE_THRESHOLD) return 0;
  if (WHITE_FEATHER > 0 && brightness >= WHITE_THRESHOLD - WHITE_FEATHER) {
    return Math.round(((WHITE_THRESHOLD - brightness) / WHITE_FEATHER) * 255);
  }
  return 255;
}

function isEdgeMattePixel(r, g, b) {
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness >= EDGE_MATTE_LUMINANCE && chroma <= EDGE_MATTE_CHROMA;
}

function removeEdgeConnectedMatte(data, width, height) {
  const total = width * height;
  const matte = new Uint8Array(total);
  const queue = [];

  const index = (x, y) => y * width + x;

  const trySeed = (x, y) => {
    const i = index(x, y);
    if (matte[i]) return;
    const offset = i * 4;
    if (!isEdgeMattePixel(data[offset], data[offset + 1], data[offset + 2])) return;
    matte[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < width; x++) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  while (queue.length > 0) {
    const i = queue.pop();
    const x = i % width;
    const y = Math.floor(i / width);
    if (x > 0) trySeed(x - 1, y);
    if (x < width - 1) trySeed(x + 1, y);
    if (y > 0) trySeed(x, y - 1);
    if (y < height - 1) trySeed(x, y + 1);
  }

  let transparent = 0;
  for (let i = 0; i < total; i++) {
    if (!matte[i]) continue;
    const offset = i * 4;
    data[offset + 3] = 0;
    transparent++;
  }
  return transparent;
}

/** Rows below the last deckle ink row to keep (preserves torn-edge detail). */
const DECKLE_BOTTOM_PADDING = 4;

/** Lowest deckle/torn-edge ink row — cream padding below this is not part of the header art. */
function findDeckleBottomRow(data, width, height) {
  const deckleLuminance = 115;
  const deckleCoverage = 0.008;
  let lastDeckle = 0;
  for (let y = 0; y < height; y++) {
    let deckle = 0;
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const lum = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
      if (lum < deckleLuminance) deckle++;
    }
    if (deckle > width * deckleCoverage) lastDeckle = y;
  }
  return lastDeckle;
}

function cropRawBuffer(data, width, height, cropHeight) {
  const nextHeight = Math.min(height, Math.max(1, cropHeight));
  const out = Buffer.alloc(width * nextHeight * 4);
  data.copy(out, 0, 0, width * nextHeight * 4);
  return { data: out, width, height: nextHeight };
}

async function processHeaderIllustrationStrip(inputPath) {
  const basename = path.basename(inputPath);
  const pristinePath = path.join(ORIGINALS_DIR, basename);
  let sourcePath = inputPath;
  try {
    await fs.access(pristinePath);
    sourcePath = pristinePath;
  } catch {
    await ensureBackup(inputPath, basename);
  }

  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let { width, height } = info;
  const working = Buffer.from(data);

  const edgeTransparent = removeEdgeConnectedMatte(working, width, height);
  const deckleBottom = findDeckleBottomRow(working, width, height);
  const cropHeight = Math.min(height, deckleBottom + DECKLE_BOTTOM_PADDING);
  const cropped = cropRawBuffer(working, width, height, cropHeight);
  let transparent = edgeTransparent + Math.max(0, (width * height) - (width * cropped.height));

  const trimmed = await sharp(cropped.data, {
    raw: { width: cropped.width, height: cropped.height, channels: 4 },
  })
    .trim()
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });

  await sharp(trimmed.data).toFile(inputPath);

  const total = width * height;
  console.log(
    `✓  ${path.relative(ROOT, inputPath)} → true PNG (${trimmed.info.width}×${trimmed.info.height}, edge matte + deckle crop, ${transparent}/${total} px removed)`,
  );
}

function countNearBlackOpaque(data) {
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha <= 10) continue;
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (brightness <= BLACK_THRESHOLD) count++;
  }
  return count;
}

function countNearWhiteOpaque(data) {
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha <= 10) continue;
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (brightness >= WHITE_THRESHOLD) count++;
  }
  return count;
}


async function ensureBackup(inputPath, basename) {
  const backupPath = path.join(ORIGINALS_DIR, basename);
  try {
    await fs.access(backupPath);
    return;
  } catch {
    await fs.mkdir(ORIGINALS_DIR, { recursive: true });
    await fs.copyFile(inputPath, backupPath);
    console.log(`   backed up → ${path.relative(ROOT, backupPath)}`);
  }
}

async function processFile(inputPath) {
  const basename = path.basename(inputPath);
  if (EDGE_WHITE_MATTE_FILES.has(basename)) {
    await processHeaderIllustrationStrip(inputPath);
    return;
  }

  const useWhiteKey = WHITE_KEY_FILES.has(basename);
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  if (info.channels !== 4) {
    throw new Error(`${basename}: expected 4 channels after ensureAlpha(), got ${info.channels}`);
  }

  const nearBlackOpaque = countNearBlackOpaque(data);
  const nearWhiteOpaque = useWhiteKey ? countNearWhiteOpaque(data) : 0;
  if (nearBlackOpaque === 0 && nearWhiteOpaque === 0) {
    console.log(`○  ${path.relative(ROOT, inputPath)} — skip (already clean)`);
    return;
  }

  await ensureBackup(inputPath, basename);

  let transparent = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const blackAlpha = computeBlackKeyAlpha(r, g, b);
    const whiteAlpha = useWhiteKey ? computeWhiteKeyAlpha(r, g, b) : 255;
    const alpha = Math.min(blackAlpha, whiteAlpha);
    if (alpha === 0) transparent++;
    data[i + 3] = alpha;
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(inputPath);

  const total = info.width * info.height;
  const mode = useWhiteKey ? "black+white key" : "black key";
  console.log(
    `✓  ${path.relative(ROOT, inputPath)} → true PNG (${info.width}×${info.height}, ${mode}, ${transparent}/${total} px transparent)`,
  );
}

async function main() {
  let entries;
  try {
    entries = await fs.readdir(HEADER_DIR, { withFileTypes: true });
  } catch {
    console.error(`✗  Header directory not found: ${HEADER_DIR}`);
    process.exit(1);
  }

  const pngs = entries
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".png") && !d.name.includes(".source."))
    .map((d) => d.name)
    .sort();

  if (pngs.length === 0) {
    console.warn(`⚠  No PNG files found in ${path.relative(ROOT, HEADER_DIR)}`);
    process.exit(0);
  }

  console.log(
    `   Processing ${pngs.length} header PNG(s) (black≤${BLACK_THRESHOLD}, white≥${WHITE_THRESHOLD}, edge matte≥${EDGE_MATTE_LUMINANCE})...\n`,
  );

  for (const filename of pngs) {
    await processFile(path.join(HEADER_DIR, filename));
  }

  console.log("\n✓  Done.");
}

main().catch((err) => {
  console.error("✗  Conversion failed:", err.message);
  process.exit(1);
});
