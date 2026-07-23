import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const SOURCE =
  process.argv[2] ??
  "/Users/hjcfung/.cursor/projects/Users-hjcfung-Documents-into-the-pond-v3/assets/common_creatures_0-29-bf46523a-6f44-4649-8665-6e0cce17e191.png";
const OUTPUT = process.argv[3] ?? path.resolve("CreatureAssets");
const QA_OUTPUT = path.resolve(".qa/creature-assets-common");

/**
 * Hand-verified art-only source rectangles. These intentionally exclude sheet labels,
 * descriptions, rules, and neighboring cells while retaining painted halos/particles.
 * Coordinates are native source pixels; final assets are never resized.
 */
const CREATURES = [
  ["puddle_dart", 145, 45, 145, 78],
  ["bubble_mote", 290, 45, 145, 78],
  ["moss_skipper", 435, 45, 145, 78],
  ["spark_pebble", 580, 45, 145, 78],
  ["whisper_minnow", 725, 45, 145, 78],
  ["dandelion_drift", 870, 45, 130, 78],
  ["lantern_fry", 0, 193, 145, 65],
  ["paperfin", 145, 193, 145, 65],
  ["reed_glider", 290, 193, 145, 65],
  ["static_eel", 435, 193, 145, 65],
  ["cloud_guppy", 650, 193, 145, 65],
  ["ember_loop", 805, 193, 160, 65],
  ["dew_belly", 0, 335, 145, 57],
  ["zephyr_tail", 145, 335, 145, 57],
  ["firefly_nib", 335, 335, 145, 57],
  ["moonscale", 490, 335, 145, 57],
  ["lily_wisp", 650, 335, 145, 57],
  ["drift_scribe", 805, 335, 175, 57],
  ["glowmoth", 0, 465, 145, 49],
  ["blueglass", 145, 465, 145, 49],
  ["leafling", 320, 465, 145, 49],
  ["pulse_jelly", 490, 465, 145, 49],
  ["hushfin", 650, 465, 145, 49],
  ["stone_nibble", 805, 465, 160, 49],
  ["ripple_wing", 0, 572, 145, 52],
  ["lantern_jell", 145, 572, 145, 52],
  ["breeze_dot", 290, 572, 145, 52],
  ["quill_flicker", 435, 572, 145, 52],
  ["mistgill", 580, 572, 145, 52],
  ["dreamweaver", 725, 572, 145, 52],
].map(([name, left, top, width, height], index) => ({
  index,
  name,
  left,
  top,
  width,
  height,
}));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function percentile(values, p) {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  return values[Math.floor((values.length - 1) * p)];
}

function median(values) {
  return percentile(values, 0.5);
}

/**
 * Estimate the local paper matte from corner and edge patches. The art rectangles
 * include clean paper around each composition, so a robust warm/light sample rejects
 * colored paint, ink, and dark foxing.
 */
function estimatePaper(rgb, width, height) {
  const candidates = [];
  const edgeDepth = Math.max(5, Math.round(Math.min(width, height) * 0.09));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const onEdge =
        x < edgeDepth || x >= width - edgeDepth || y < edgeDepth || y >= height - edgeDepth;
      if (!onEdge) continue;
      const i = (y * width + x) * 3;
      const r = rgb[i];
      const g = rgb[i + 1];
      const b = rgb[i + 2];
      const light = (r + g + b) / 3;
      const warm = r >= b && g >= b - 8;
      if (light > 145 && warm) candidates.push([r, g, b]);
    }
  }

  return [
    median(candidates.map((c) => c[0])),
    median(candidates.map((c) => c[1])),
    median(candidates.map((c) => c[2])),
  ];
}

/**
 * GIMP-style color-to-alpha against the locally estimated paper matte.
 * This exactly reproduces each source pixel when composited back over that matte.
 * A low noise floor suppresses the flattened paper grain without hard-clipping paint.
 */
function createAlphaMatte(
  rgb,
  width,
  height,
  paper,
  noiseFloor,
  wideComposition,
  centerXRatio,
) {
  const rgba = Buffer.alloc(width * height * 4);
  const rawAlpha = new Float32Array(width * height);

  for (let p = 0; p < width * height; p += 1) {
    const i = p * 3;
    let alpha = 0;
    for (let c = 0; c < 3; c += 1) {
      const source = rgb[i + c];
      const matte = paper[c];
      const channelAlpha =
        source >= matte
          ? (source - matte) / Math.max(1, 255 - matte)
          : (matte - source) / Math.max(1, matte);
      alpha = Math.max(alpha, channelAlpha);
    }

    // Preserve source-derived translucency rather than inflating weak paper
    // deviations into opaque pixels. Only the local paper-noise floor is removed.
    if (alpha <= noiseFloor) {
      alpha = 0;
    } else if (alpha < noiseFloor + 0.026) {
      const t = (alpha - noiseFloor) / 0.026;
      alpha *= t * t * (3 - 2 * t);
    }
    rawAlpha[p] = alpha;
  }

  // A small, edge-aware neighborhood pass reduces isolated paper pinholes without
  // erasing deliberate one-pixel particles. Max support keeps faint attached marks.
  const refined = new Float32Array(rawAlpha);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const p = y * width + x;
      const a = rawAlpha[p];
      if (a >= 0.08) continue;
      let support = 0;
      let maxNeighbor = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const n = rawAlpha[(y + oy) * width + x + ox];
          if (n > noiseFloor) support += 1;
          maxNeighbor = Math.max(maxNeighbor, n);
        }
      }
      if (support === 0) refined[p] = 0;
      else if (support >= 3) refined[p] = Math.max(a, maxNeighbor * 0.22);
    }
  }

  // Source grid rules and residual foxing live outside the painted vignette. A
  // feathered superellipse follows the sheet's existing watercolor-wash boundary;
  // it removes flattened cell artifacts without creating a hard lasso contour.
  const horizontalFeather = width * (wideComposition ? 0.055 : 0.11);
  const verticalFeather = height * 0.1;
  const smoothstep = (t) => {
    const v = clamp(t, 0, 1);
    return v * v * (3 - 2 * v);
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x;
      const nx = Math.abs((x - (width - 1) * centerXRatio) / (width * 0.5));
      const ny = Math.abs((y - (height - 1) / 2) / (height * 0.58));
      const exponent = wideComposition ? 4 : 2;
      const vignetteDistance =
        (nx ** exponent + ny ** exponent) ** (1 / exponent);
      const vignetteInner = wideComposition ? 0.73 : 0.68;
      const vignetteWidth = wideComposition ? 0.22 : 0.2;
      const vignetteMask =
        1 - smoothstep((vignetteDistance - vignetteInner) / vignetteWidth);
      const edgeMask =
        smoothstep(Math.min(x, width - 1 - x) / horizontalFeather) *
        smoothstep(Math.min(y, height - 1 - y) / verticalFeather) *
        vignetteMask;
      refined[p] *= edgeMask;
    }
  }

  for (let p = 0; p < width * height; p += 1) {
    const i = p * 3;
    const o = p * 4;
    const alpha = refined[p];

    if (alpha <= 0) {
      rgba[o] = 0;
      rgba[o + 1] = 0;
      rgba[o + 2] = 0;
      rgba[o + 3] = 0;
      continue;
    }

    // Unmatte RGB to prevent warm paper fringe on dark or differently colored UI.
    for (let c = 0; c < 3; c += 1) {
      const observed = rgb[i + c] / 255;
      const matte = paper[c] / 255;
      const foreground = (observed - matte * (1 - alpha)) / Math.max(alpha, 1 / 255);
      rgba[o + c] = Math.round(clamp(foreground, 0, 1) * 255);
    }
    rgba[o + 3] = Math.round(alpha * 255);
  }

  return { rgba, alpha: refined };
}

function findPaintBounds(alpha, width, height) {
  // Include translucent outer paint. Ignore only essentially invisible matte noise.
  const threshold = 6 / 255;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alpha[y * width + x] <= threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return { left: 0, top: 0, width, height };

  const paintedWidth = maxX - minX + 1;
  const paintedHeight = maxY - minY + 1;
  const margin = Math.max(4, Math.round(Math.max(paintedWidth, paintedHeight) * 0.06));
  const left = Math.max(0, minX - margin);
  const top = Math.max(0, minY - margin);
  const right = Math.min(width - 1, maxX + margin);
  const bottom = Math.min(height - 1, maxY + margin);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function checkerSvg(width, height, cell = 12) {
  const tiles = [];
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      const fill = (x / cell + y / cell) % 2 === 0 ? "#ede7dc" : "#cfc6b8";
      tiles.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}"/>`);
    }
  }
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${tiles.join("")}</svg>`,
  );
}

async function buildContactSheet(assetPaths, background, outputPath) {
  const cellWidth = 168;
  const cellHeight = 124;
  const columns = 6;
  const rows = 5;
  const width = cellWidth * columns;
  const height = cellHeight * rows;
  const base =
    background === "checker"
      ? sharp(checkerSvg(width, height))
      : sharp({
          create: {
            width,
            height,
            channels: 4,
            background: background === "dark" ? "#34281f" : "#f9f3e8",
          },
        });
  const composites = [];

  for (let i = 0; i < assetPaths.length; i += 1) {
    const { path: assetPath, name } = assetPaths[i];
    const metadata = await sharp(assetPath).metadata();
    const x = (i % columns) * cellWidth;
    const y = Math.floor(i / columns) * cellHeight;
    composites.push({
      input: assetPath,
      left: x + Math.max(0, Math.floor((cellWidth - metadata.width) / 2)),
      top: y + 4 + Math.max(0, Math.floor((94 - metadata.height) / 2)),
    });
    composites.push({
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${cellWidth}" height="24"><text x="${cellWidth / 2}" y="16" text-anchor="middle" font-family="sans-serif" font-size="11" fill="${background === "dark" ? "#f1e5d5" : "#46372d"}">${name.replaceAll("_", " ")}</text></svg>`,
      ),
      left: x,
      top: y + 98,
    });
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await base.composite(composites).png({ compressionLevel: 9 }).toFile(outputPath);
}

async function main() {
  const source = sharp(SOURCE, { failOn: "error" });
  const sourceMeta = await source.metadata();
  if (sourceMeta.width !== 1024 || sourceMeta.height !== 682) {
    throw new Error(
      `Expected common sheet at 1024×682; received ${sourceMeta.width}×${sourceMeta.height}`,
    );
  }
  await fs.mkdir(OUTPUT, { recursive: true });
  await fs.mkdir(QA_OUTPUT, { recursive: true });

  const exported = [];
  const manifest = [];
  for (const creature of CREATURES) {
    const { data: rgb, info } = await sharp(SOURCE)
      .extract({
        left: creature.left,
        top: creature.top,
        width: creature.width,
        height: creature.height,
      })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const paper = estimatePaper(rgb, info.width, info.height);
    const delicate = new Set([
      "bubble_mote",
      "dandelion_drift",
      "lily_wisp",
      "drift_scribe",
      "ripple_wing",
      "lantern_jell",
      "breeze_dot",
      "mistgill",
      "dreamweaver",
    ]);
    const wideComposition = new Set([
      "whisper_minnow",
      "dandelion_drift",
      "reed_glider",
      "ember_loop",
      "drift_scribe",
      "ripple_wing",
      "quill_flicker",
      "dreamweaver",
    ]).has(creature.name);
    const centerXRatio =
      {
        puddle_dart: 0.43,
        bubble_mote: 0.44,
        spark_pebble: 0.45,
        paperfin: 0.57,
        static_eel: 0.57,
        zephyr_tail: 0.57,
        firefly_nib: 0.43,
        drift_scribe: 0.57,
        blueglass: 0.57,
        pulse_jelly: 0.43,
        hushfin: 0.46,
        stone_nibble: 0.46,
        ripple_wing: 0.57,
        lantern_jell: 0.57,
        breeze_dot: 0.57,
        quill_flicker: 0.57,
        mistgill: 0.57,
        dreamweaver: 0.57,
      }[creature.name] ?? 0.5;
    const noiseFloor = delicate.has(creature.name) ? 0.13 : 0.18;
    const { rgba, alpha } = createAlphaMatte(
      rgb,
      info.width,
      info.height,
      paper,
      noiseFloor,
      wideComposition,
      centerXRatio,
    );
    const bounds = findPaintBounds(alpha, info.width, info.height);
    const outputPath = path.join(OUTPUT, `${creature.name}.png`);

    await sharp(rgba, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .extract(bounds)
      .withIccProfile("srgb")
      .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
      .toFile(outputPath);

    const alphaValues = Array.from(alpha);
    const visiblePixels = alphaValues.filter((a) => a > 4 / 255).length;
    const edgePixels = alphaValues.filter((a) => a > 0 && a < 1).length;
    exported.push({ path: outputPath, name: creature.name });
    manifest.push({
      index: creature.index,
      name: creature.name,
      file: `${creature.name}.png`,
      sourceRect: {
        left: creature.left,
        top: creature.top,
        width: creature.width,
        height: creature.height,
      },
      cropWithinSourceRect: bounds,
      localPaperRgb: paper,
      alphaNoiseFloor: noiseFloor,
      visiblePixels,
      semiTransparentPixels: edgePixels,
    });
  }

  await fs.writeFile(
    path.join(QA_OUTPUT, "manifest.json"),
    `${JSON.stringify(
      {
        source: SOURCE,
        sourceSize: [sourceMeta.width, sourceMeta.height],
        sourceProfile: sourceMeta.icc ? "embedded" : "declared sRGB",
        extraction: manifest,
      },
      null,
      2,
    )}\n`,
  );
  await buildContactSheet(exported, "checker", path.join(QA_OUTPUT, "checker.png"));
  await buildContactSheet(exported, "warm", path.join(QA_OUTPUT, "warm.png"));
  await buildContactSheet(exported, "dark", path.join(QA_OUTPUT, "dark.png"));

  console.log(`Exported ${exported.length} native-resolution transparent PNGs to ${OUTPUT}`);
  console.log(`QA sheets written to ${QA_OUTPUT}`);
}

await main();
