/**
 * Bakes scene gradients into Well background PNGs (asset-only, no runtime overlays).
 *
 * Top hood:    rgba(26,32,48,0.45) at y=0 → transparent at 12% height
 * Bottom vignette (closeup only): transparent at 60% → rgba(42,56,80,0.55) at bottom
 *
 * Usage:
 *   node scripts/bake_well_scene_gradients.js
 *   node scripts/bake_well_scene_gradients.js --top-only
 *   node scripts/bake_well_scene_gradients.js --bottom-only
 */

const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const CLOSEUP = path.join(ROOT, "assets/well/well_scene_closeup.png");
const ESTABLISHING = path.join(ROOT, "assets/well/well_scene_establishing.png");

const TOP_HOOD_RGB = [26, 32, 48];
const TOP_HOOD_MAX_ALPHA = 0.45;
const TOP_HOOD_END_Y = 0.12;

const BOTTOM_VIGNETTE_RGB = [42, 56, 80];
const BOTTOM_VIGNETTE_MAX_ALPHA = 0.55;
const BOTTOM_VIGNETTE_START_Y = 0.6;

const args = new Set(process.argv.slice(2));
const topOnly = args.has("--top-only");
const bottomOnly = args.has("--bottom-only");
const applyTop = bottomOnly ? false : true;
const applyBottom = topOnly ? false : true;

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function topHoodAlpha(y, height) {
  const endY = height * TOP_HOOD_END_Y;
  if (y >= endY) return 0;
  const t = 1 - y / endY;
  return smoothstep(t) * TOP_HOOD_MAX_ALPHA;
}

function bottomVignetteAlpha(x, y, width, height) {
  const startY = height * BOTTOM_VIGNETTE_START_Y;
  if (y < startY) return 0;

  const linearT = (y - startY) / (height - startY);
  const rx = (x - width / 2) / (width / 2);
  const ry = linearT;
  const radialT = Math.sqrt(rx * rx * 0.32 + ry * ry);
  const t = Math.min(1, linearT * 0.55 + radialT * 0.45);
  return smoothstep(t) * BOTTOM_VIGNETTE_MAX_ALPHA;
}

function compositeOverlay(data, width, height, alphaAt, rgb) {
  const [vr, vg, vb] = rgb;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = alphaAt(x, y);
      if (alpha <= 0) continue;

      const i = (y * width + x) * 4;
      const inv = 1 - alpha;
      data[i] = Math.round(data[i] * inv + vr * alpha);
      data[i + 1] = Math.round(data[i + 1] * inv + vg * alpha);
      data[i + 2] = Math.round(data[i + 2] * inv + vb * alpha);
      data[i + 3] = 255;
    }
  }
}

async function bakeFile(filePath, { top, bottom }) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  if (top) {
    compositeOverlay(data, width, height, (_x, y) => topHoodAlpha(y, height), TOP_HOOD_RGB);
  }
  if (bottom) {
    compositeOverlay(
      data,
      width,
      height,
      (x, y) => bottomVignetteAlpha(x, y, width, height),
      BOTTOM_VIGNETTE_RGB,
    );
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(filePath);
  const layers = [top && "top hood", bottom && "bottom vignette"].filter(Boolean).join(" + ");
  console.log(`Baked ${layers} into ${path.relative(ROOT, filePath)} (${width}x${height})`);
}

async function main() {
  await bakeFile(ESTABLISHING, { top: applyTop, bottom: false });
  await bakeFile(CLOSEUP, { top: applyTop, bottom: applyBottom });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
