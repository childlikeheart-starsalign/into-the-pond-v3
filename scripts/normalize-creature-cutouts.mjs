/**
 * Normalize creature cutouts onto a uniform square canvas for field-note contain-fit.
 *
 * - Alpha threshold 32 for content bbox (ignores near-invisible fringe)
 * - 320×320 transparent square
 * - Longer side of content fills ~82% of the canvas; centered
 *
 * Usage: node scripts/normalize-creature-cutouts.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const DIR = path.resolve("assets/Fishing/creatureCutouts");
const CANVAS = 320;
const FILL = 0.82;
const ALPHA_MIN = 32;

function contentBBox(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = data[(y * width + x) * 4 + 3];
      if (a < ALPHA_MIN) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

async function normalizeFile(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 4) {
    throw new Error(`${path.basename(filePath)}: expected RGBA, got ${info.channels}`);
  }

  const bbox = contentBBox(data, info.width, info.height);
  if (!bbox) {
    return { status: "empty", aspect: null };
  }

  const aspect = bbox.width / bbox.height;
  const targetLong = Math.round(CANVAS * FILL);
  const scale = targetLong / Math.max(bbox.width, bbox.height);
  const outW = Math.max(1, Math.round(bbox.width * scale));
  const outH = Math.max(1, Math.round(bbox.height * scale));
  const left = Math.round((CANVAS - outW) / 2);
  const top = Math.round((CANVAS - outH) / 2);

  const cropped = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(bbox)
    .resize(outW, outH, { fit: "fill", kernel: "lanczos3" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: cropped, left, top }])
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(filePath);

  return { status: "ok", aspect, outW, outH };
}

async function main() {
  const entries = await fs.readdir(DIR);
  const files = entries.filter((f) => f.endsWith(".png")).sort();
  let ok = 0;
  const empty = [];
  const extreme = [];

  for (const file of files) {
    const filePath = path.join(DIR, file);
    const result = await normalizeFile(filePath);
    if (result.status === "empty") {
      empty.push(file);
      console.warn(`empty alpha: ${file}`);
      continue;
    }
    ok += 1;
    if (result.aspect < 0.5 || result.aspect > 2.8) {
      extreme.push({ file, aspect: result.aspect });
    }
  }

  console.log(`Normalized ${ok}/${files.length} → ${CANVAS}×${CANVAS} (~${FILL * 100}% fill)`);
  if (empty.length) console.warn(`Empty: ${empty.join(", ")}`);
  if (extreme.length) {
    console.warn(
      `Extreme aspect (pre-normalize content): ${extreme
        .map((e) => `${e.file}=${e.aspect.toFixed(2)}`)
        .join(", ")}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
