#!/usr/bin/env node
/**
 * Crop the parchment tab-bar strip from tab_bar_parchment_strip_source.png.
 * Discards the black/empty area above the strip.
 *
 * Usage: node scripts/process_sanctuary_tab_bar_strip.mjs
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "assets/images/sanctuary/tab_bar_parchment_strip_source.png");
const OUT = path.join(ROOT, "assets/images/sanctuary/sanctuary_tab_bar_strip.png");
const META_OUT = path.join(ROOT, "assets/images/sanctuary/sanctuary_tab_bar_strip.meta.json");

/** Pixels with RGB sum above this are treated as parchment (not black). */
const BLACK_THRESHOLD = 48;

async function findParchmentBandTop(raw, width, height, channels) {
  let bandTop = height;

  for (let y = height - 1; y >= 0; y -= 1) {
    let rowHasParchment = false;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      const sum = raw[i] + raw[i + 1] + raw[i + 2];
      if (sum > BLACK_THRESHOLD) {
        rowHasParchment = true;
        break;
      }
    }
    if (rowHasParchment) {
      bandTop = y;
    } else if (bandTop < height) {
      break;
    }
  }

  return bandTop;
}

async function main() {
  const source = sharp(SOURCE);
  const { width, height, channels } = await source.metadata();
  if (!width || !height) {
    throw new Error(`Could not read source dimensions: ${SOURCE}`);
  }

  const { data, info } = await sharp(SOURCE).raw().toBuffer({ resolveWithObject: true });
  const bandTop = await findParchmentBandTop(data, info.width, info.height, info.channels);

  if (bandTop >= info.height - 1) {
    throw new Error("No parchment band detected in source image");
  }

  const cropped = await sharp(SOURCE)
    .extract({
      left: 0,
      top: bandTop,
      width: info.width,
      height: info.height - bandTop,
    })
    .png()
    .toFile(OUT);

  const trimmed = await sharp(OUT).trim({ threshold: 12 }).png().toBuffer();
  await sharp(trimmed).toFile(OUT);

  const finalMeta = await sharp(OUT).metadata();

  const artboardWidth = 576;
  const artboardHeight = 1024;
  const outputWidth = finalMeta.width ?? cropped.width;
  const outputHeight = finalMeta.height ?? cropped.height;
  const stripHeightRatioOnArtboard = outputHeight / artboardHeight;

  const meta = {
    sourceWidth: info.width,
    sourceHeight: info.height,
    cropTop: bandTop,
    outputWidth,
    outputHeight,
    artboardWidth,
    artboardHeight,
    stripHeightRatioOnArtboard,
  };

  await import("node:fs/promises").then((fs) =>
    fs.writeFile(META_OUT, `${JSON.stringify(meta, null, 2)}\n`),
  );

  console.log(`wrote ${path.relative(ROOT, OUT)} (${outputWidth}x${outputHeight})`);
  console.log(`stripHeightRatioOnArtboard=${stripHeightRatioOnArtboard.toFixed(4)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
