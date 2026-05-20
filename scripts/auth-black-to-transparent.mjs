#!/usr/bin/env node
/**
 * Converts pure-black (#000000) pixels to transparent alpha for every PNG under assets/images/auth/.
 *
 * Assumptions (required for acceptable results):
 * - Background is exact RGB (0, 0, 0).
 * - Foreground artwork contains no pixels that are exactly (0, 0, 0).
 *
 * Usage:
 *   node scripts/auth-black-to-transparent.mjs
 *   node scripts/auth-black-to-transparent.mjs --dry-run
 *   node scripts/auth-black-to-transparent.mjs --dir ./assets/images/auth
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const DEFAULT_DIR = path.join(process.cwd(), "assets/images/auth");

function parseArgs(argv) {
  let dryRun = false;
  let dir = DEFAULT_DIR;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    else if (a === "--dir" && argv[i + 1]) {
      dir = path.resolve(process.cwd(), argv[++i]);
    } else if (a === "--help" || a === "-h") {
      console.log(`Usage: node scripts/auth-black-to-transparent.mjs [--dry-run] [--dir <path>]`);
      process.exit(0);
    }
  }
  return { dryRun, dir };
}

/**
 * @param {Buffer} data
 * @param {number} channels  (4 after ensureAlpha)
 */
function blackToTransparent(data, channels) {
  let replaced = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r === 0 && g === 0 && b === 0) {
      data[i + channels - 1] = 0;
      replaced++;
    }
  }
  return replaced;
}

async function processPng(filePath, dryRun) {
  const pipeline = sharp(filePath).ensureAlpha();
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  if (channels !== 4) {
    throw new Error(`${filePath}: expected 4 channels after ensureAlpha(), got ${channels}`);
  }

  const replaced = blackToTransparent(data, channels);

  if (dryRun) {
    console.log(
      `[dry-run] ${path.relative(process.cwd(), filePath)} — would clear alpha on ${replaced} pixel(s)`,
    );
    return { replaced, wrote: false };
  }

  const tmpPath = `${filePath}.tmp.${process.pid}.png`;
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(tmpPath);

  await fs.rename(tmpPath, filePath);
  console.log(`${path.relative(process.cwd(), filePath)} — cleared alpha on ${replaced} pixel(s)`);
  return { replaced, wrote: true };
}

async function main() {
  const { dryRun, dir } = parseArgs(process.argv);

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    console.error(`Cannot read directory: ${dir}`, e);
    process.exit(1);
  }

  const pngFiles = entries
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".png"))
    .map((d) => d.name);

  if (pngFiles.length === 0) {
    console.log(`No PNG files in ${dir}`);
    process.exit(0);
  }

  pngFiles.sort();
  console.log(`${dryRun ? "Dry run — " : ""}Processing ${pngFiles.length} PNG(s) in ${dir}`);

  for (const name of pngFiles) {
    const filePath = path.join(dir, name);
    try {
      await processPng(filePath, dryRun);
    } catch (err) {
      console.error(`Failed: ${filePath}`, err);
      process.exitCode = 1;
    }
  }
}

await main();
