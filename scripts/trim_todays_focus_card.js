/**
 * Strips outer matte / checkerboard surround from focus card PNGs.
 * Flood-fills bright edge-connected pixels to transparent, then trims.
 *
 * Usage: node scripts/trim_todays_focus_card.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const FILES = [
  path.join(ROOT, "assets/well/todays_focus_card.png"),
  path.join(ROOT, "assets/well/todays_focus_card_back.png"),
];

const SOURCE = path.join(
  "/Users/hjcfung/.cursor/projects/Users-hjcfung-Documents-into-the-pond-v3/assets",
  "updated-todays_focus_card-4e8982fb-ce19-4a51-91fc-f3e9906dfa0a.png",
);

const BRIGHT = 234;

function idx(x, y, width) {
  return (y * width + x) * 4;
}

function isBright(data, i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  return r >= BRIGHT && g >= BRIGHT && b >= BRIGHT;
}

function floodKeyEdges(data, width, height) {
  const seen = new Uint8Array(width * height);
  const stack = [];

  for (let x = 0; x < width; x++) {
    stack.push([x, 0], [x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    stack.push([0, y], [width - 1, y]);
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = y * width + x;
    if (seen[p]) continue;
    seen[p] = 1;

    const i = idx(x, y, width);
    if (data[i + 3] === 0) continue;
    if (!isBright(data, i)) continue;

    data[i + 3] = 0;
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function trimBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[idx(x, y, width) + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX) return null;

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const out = Buffer.alloc(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const src = idx(minX + x, minY + y, width);
      const dst = (y * cropW + x) * 4;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      out[dst + 3] = data[src + 3];
    }
  }

  return { data: out, width: cropW, height: cropH };
}

async function processFromBuffer(inputBuffer, outPath) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  floodKeyEdges(data, info.width, info.height);
  const trimmed = trimBounds(data, info.width, info.height);
  if (!trimmed) throw new Error("No opaque pixels left after matte removal");

  await sharp(trimmed.data, {
    raw: { width: trimmed.width, height: trimmed.height, channels: 4 },
  })
    .png()
    .toFile(outPath);

  console.log(
    `Trimmed ${path.relative(ROOT, outPath)} → ${trimmed.width}x${trimmed.height} (aspect ${(trimmed.width / trimmed.height).toFixed(4)})`,
  );
  return trimmed;
}

async function main() {
  const input = fs.existsSync(SOURCE)
    ? await sharp(SOURCE).resize(682, 1024, { fit: "fill" }).png().toBuffer()
    : await sharp(FILES[0]).png().toBuffer();

  const trimmed = await processFromBuffer(input, FILES[0]);
  await processFromBuffer(input, FILES[1]);
  console.log("Set WELL_CARD_ASPECT to", trimmed.width / trimmed.height);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
