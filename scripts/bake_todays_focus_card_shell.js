/**
 * Rebuilds todays_focus_card.png shell: strip bottom mist, add soft top glow only.
 *
 * Usage: node scripts/bake_todays_focus_card_shell.js
 */

const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const CARD = path.join(ROOT, "assets/well/todays_focus_card.png");

const BOTTOM_GLOW_START = 0.68;
const TOP_GLOW_END = 0.1;
const TOP_GLOW_MAX_ALPHA = 0.22;

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function isMistPixel(r, g, b, a) {
  if (a < 8) return false;
  const brightness = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness > 175 && chroma < 55;
}

function stripBottomGlow(data, width, height) {
  const startY = Math.floor(height * BOTTOM_GLOW_START);
  for (let y = startY; y < height; y++) {
    const t = (y - startY) / (height - startY);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a === 0) continue;

      const mist = isMistPixel(r, g, b, a);
      const fade = smoothstep(Math.max(0, (t - 0.15) / 0.85));
      if (!mist && t < 0.45) continue;

      const nextAlpha = Math.round(a * (1 - fade));
      data[i + 3] = nextAlpha;
      if (nextAlpha < 8) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }
  }
}

function addTopGlow(data, width, height) {
  const endY = Math.floor(height * TOP_GLOW_END);
  const glowRgb = [255, 248, 238];

  for (let y = 0; y < endY; y++) {
    const t = 1 - y / endY;
    const glowAlpha = smoothstep(t) * TOP_GLOW_MAX_ALPHA;
    if (glowAlpha <= 0) continue;

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] === 0) continue;
      const inv = 1 - glowAlpha;
      data[i] = Math.round(data[i] * inv + glowRgb[0] * glowAlpha);
      data[i + 1] = Math.round(data[i + 1] * inv + glowRgb[1] * glowAlpha);
      data[i + 2] = Math.round(data[i + 2] * inv + glowRgb[2] * glowAlpha);
    }
  }
}

async function main() {
  const { data, info } = await sharp(CARD)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  stripBottomGlow(data, info.width, info.height);
  addTopGlow(data, info.width, info.height);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(CARD);
  console.log(
    `Rebuilt focus card shell: ${path.relative(ROOT, CARD)} (${info.width}x${info.height})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
