#!/usr/bin/env node
/**
 * Trim-only replacement for header_illustration_strip.png.
 * Does NOT run deckle crop or edge matte from process_sanctuary_header_assets.mjs.
 *
 * Usage:
 *   node scripts/trim_header_illustration_strip.mjs <input.png> [output.png]
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEFAULT_OUTPUT = path.join(ROOT, "assets/sanctuary/header/header_illustration_strip.png");

const BLACK_THRESHOLD = 30;
const BLACK_FEATHER = 20;

function computeBlackKeyAlpha(r, g, b) {
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  if (brightness <= BLACK_THRESHOLD) return 0;
  if (BLACK_FEATHER > 0 && brightness <= BLACK_THRESHOLD + BLACK_FEATHER) {
    return Math.round(((brightness - BLACK_THRESHOLD) / BLACK_FEATHER) * 255);
  }
  return 255;
}

function applyBlackKey(data) {
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = computeBlackKeyAlpha(data[i], data[i + 1], data[i + 2]);
  }
}

function hasMeaningfulTransparency(data) {
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) transparent++;
  }
  return transparent > data.length / 4 / 100;
}

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] ?? DEFAULT_OUTPUT;
  if (!inputPath) {
    console.error("Usage: node scripts/trim_header_illustration_strip.mjs <input.png> [output.png]");
    process.exit(1);
  }

  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const working = Buffer.from(data);

  if (!hasMeaningfulTransparency(working)) {
    applyBlackKey(working);
  }

  const trimmed = await sharp(working, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });

  await sharp(trimmed.data).toFile(outputPath);

  console.log(
    `✓  ${path.relative(ROOT, inputPath)} → ${path.relative(ROOT, outputPath)} (${trimmed.info.width}×${trimmed.info.height})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
