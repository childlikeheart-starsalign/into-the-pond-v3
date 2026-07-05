/**
 * Removes black backgrounds from rod collection ceremony art.
 * Usage: node scripts/process-rod-collection-assets.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "assets/Craft bench/rod-collection/source");
const OUTPUT_DIR = path.join(ROOT, "assets/Craft bench/rod-collection");

const THRESHOLD = 28;
const FEATHER = 18;

async function removeBlackBackground(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data.length);
  pixels.set(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    let alpha = 255;
    if (luminance <= THRESHOLD) {
      alpha = 0;
    } else if (luminance <= THRESHOLD + FEATHER) {
      alpha = Math.round(((luminance - THRESHOLD) / FEATHER) * 255);
    }

    pixels[i + 3] = alpha;
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outputPath);
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error("Missing source dir:", SOURCE_DIR);
    process.exit(1);
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".png"));
  for (const file of files) {
    const input = path.join(SOURCE_DIR, file);
    const output = path.join(OUTPUT_DIR, file);
    await removeBlackBackground(input, output);
    console.log("Wrote", output);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
