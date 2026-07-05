#!/usr/bin/env node
/**
 * Knock out near-black / near-white letterbox pixels on sanctuary mood frames 60–63.
 * Preserves 576×1024 artboard coordinates for full-frame cover compositing.
 *
 * Usage: node scripts/process_sanctuary_mood_overlays.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const META_PATH = path.join(ROOT, "assets/images/sanctuary/mood_overlays.meta.json");

/** Pixels with RGB sum below this are treated as black letterbox. */
const BLACK_THRESHOLD = 48;
/** Channels above this are treated as white letterbox. */
const WHITE_THRESHOLD = 245;

function shouldMakeTransparent(r, g, b) {
  if (r + g + b < BLACK_THRESHOLD) return true;
  if (r > WHITE_THRESHOLD && g > WHITE_THRESHOLD && b > WHITE_THRESHOLD) return true;
  return false;
}

async function processFrame(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels < 4) {
    throw new Error(`Expected RGBA input: ${inputPath}`);
  }

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (shouldMakeTransparent(r, g, b)) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, { raw: { width, height, channels: 4 } }).png();
}

async function main() {
  const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));

  for (const frame of meta.frames) {
    const inputPath = path.join(ROOT, frame.frameOutput);
    const moodOutputPath = path.join(ROOT, frame.output);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Missing frame asset: ${inputPath}`);
    }

    const processed = await processFrame(inputPath);
    const buffer = await processed.toBuffer();

    fs.writeFileSync(inputPath, buffer);
    fs.writeFileSync(moodOutputPath, buffer);

    console.log(
      `Processed frame ${frame.frameId} (${frame.timeOfDay}/${frame.color}) → ${frame.frameOutput}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
