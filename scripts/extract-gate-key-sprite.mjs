#!/usr/bin/env node
/**
 * Extracts a trimmed transparent key sprite from gate-key.png (JPEG-on-PNG export).
 *
 * Steps: ensureAlpha → near-black matte to transparent → trim → defringe dark edges → trim → write PNG.
 *
 * Usage:
 *   node scripts/extract-gate-key-sprite.mjs
 *   node scripts/extract-gate-key-sprite.mjs --input ./assets/images/gate-key.png --output ./assets/images/gate-key-sprite.png
 */

import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const DEFAULT_INPUT = path.join(process.cwd(), "assets/images/gate-key.png");
const DEFAULT_OUTPUT = path.join(process.cwd(), "assets/images/gate-key-sprite.png");

/** Pixels with max(R,G,B) below this are treated as JPEG matte and cleared. */
const DEFAULT_MATTE_THRESHOLD = 60;
/** Dark edge pixels touching transparency are cleared to remove visible black fringe. */
const DEFAULT_DEFRINGE_THRESHOLD = 80;

function parseArgs(argv) {
  let input = DEFAULT_INPUT;
  let output = DEFAULT_OUTPUT;
  let matteThreshold = DEFAULT_MATTE_THRESHOLD;
  let defringeThreshold = DEFAULT_DEFRINGE_THRESHOLD;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input" && argv[i + 1]) {
      input = path.resolve(process.cwd(), argv[++i]);
    } else if (a === "--output" && argv[i + 1]) {
      output = path.resolve(process.cwd(), argv[++i]);
    } else if (a === "--threshold" && argv[i + 1]) {
      matteThreshold = Number(argv[++i]);
    } else if (a === "--defringe" && argv[i + 1]) {
      defringeThreshold = Number(argv[++i]);
    } else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: node scripts/extract-gate-key-sprite.mjs [--input <path>] [--output <path>] [--threshold <0-255>] [--defringe <0-255>]",
      );
      process.exit(0);
    }
  }
  return { input, output, matteThreshold, defringeThreshold };
}

/**
 * Clears alpha on near-black JPEG matte (pure black and compression fringe).
 * @param {Buffer} data
 * @param {number} channels
 * @param {number} matteThreshold
 */
function matteToTransparent(data, channels, matteThreshold) {
  let replaced = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxChannel = Math.max(r, g, b);
    if (maxChannel < matteThreshold) {
      data[i + channels - 1] = 0;
      replaced++;
    }
  }
  return replaced;
}

/**
 * Clears dark pixels on the outer edge that read as a black halo on light backgrounds.
 * @param {Buffer} data
 * @param {number} width
 * @param {number} height
 * @param {number} channels
 * @param {number} defringeThreshold
 */
function defringeTransparentEdge(data, width, height, channels, defringeThreshold) {
  let replaced = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i + channels - 1] === 0) continue;

      const touchesTransparency =
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        (x > 0 && data[(y * width + (x - 1)) * channels + (channels - 1)] === 0) ||
        (x < width - 1 && data[(y * width + (x + 1)) * channels + (channels - 1)] === 0) ||
        (y > 0 && data[((y - 1) * width + x) * channels + (channels - 1)] === 0) ||
        (y < height - 1 && data[((y + 1) * width + x) * channels + (channels - 1)] === 0);

      if (!touchesTransparency) continue;

      const maxChannel = Math.max(data[i], data[i + 1], data[i + 2]);
      if (maxChannel < defringeThreshold) {
        data[i + channels - 1] = 0;
        replaced++;
      }
    }
  }
  return replaced;
}

async function main() {
  const { input, output, matteThreshold, defringeThreshold } = parseArgs(process.argv);

  const meta = await sharp(input).metadata();
  console.log(
    `Input: ${path.relative(process.cwd(), input)} (${meta.width}x${meta.height}, ${meta.format})`,
  );

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  if (channels !== 4) {
    throw new Error(`Expected 4 channels after ensureAlpha(), got ${channels}`);
  }

  const replaced = matteToTransparent(data, channels, matteThreshold);
  console.log(
    `Cleared alpha on ${replaced} matte pixel(s) (max channel < ${matteThreshold})`,
  );

  const trimmed = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const defringed = Buffer.from(trimmed.data);
  const defringedCount = defringeTransparentEdge(
    defringed,
    trimmed.info.width,
    trimmed.info.height,
    trimmed.info.channels,
    defringeThreshold,
  );
  console.log(
    `Defringed ${defringedCount} dark edge pixel(s) (max channel < ${defringeThreshold})`,
  );

  await sharp(defringed, {
    raw: { width: trimmed.info.width, height: trimmed.info.height, channels: trimmed.info.channels },
  })
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(output);

  const { width, height } = await sharp(output).metadata();
  console.log(
    `Output: ${path.relative(process.cwd(), output)} (${width}x${height} RGBA PNG)`,
  );
}

await main();
