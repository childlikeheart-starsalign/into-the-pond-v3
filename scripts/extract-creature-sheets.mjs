/**
 * Efficient multi-sheet creature extraction.
 *
 * Lessons from the common-sheet pass:
 * - Same 1024×682 parchment layout across rarity sheets
 * - Color-to-alpha against local paper preserves watercolor without repainting
 * - Rare/epic sheets place each creature in a dark vignette — detect those, don't hand-tune every cell
 * - Name from official catalog pools so assets match app IDs
 *
 * Usage:
 *   node scripts/extract-creature-sheets.mjs
 *   node scripts/extract-creature-sheets.mjs --sheet=rare_fire
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const ASSETS =
  "/Users/hjcfung/.cursor/projects/Users-hjcfung-Documents-into-the-pond-v3/assets";
const OUTPUT = path.resolve("CreatureAssets");
const QA_ROOT = path.resolve(".qa/creature-assets");

const SHEETS = [
  {
    key: "rare_fire",
    file: "rare_fire_creatures_30-43-97a3cb65-d822-425d-8266-6cea0ccc30f5.png",
    pool: "src/data/creatures/pool_rare_fire.ts",
    expected: 14,
  },
  {
    key: "rare_water",
    file: "rare_water_creatures_44-57-a13002be-c708-4ae6-a89f-36589294c409.png",
    pool: "src/data/creatures/pool_rare_water.ts",
    expected: 14,
  },
  {
    key: "rare_wind",
    file: "rare_creatures_wind_58-71-1abfcdef-066a-4e51-8769-058e34ad6410.png",
    pool: "src/data/creatures/pool_rare_wind.ts",
    expected: 14,
  },
  {
    key: "rare_electric",
    file: "rare_creatures_electric_72-85-cb0f08e6-8cd7-479b-843d-1b50c84f569a.png",
    pool: "src/data/creatures/pool_rare_electric.ts",
    expected: 14,
  },
  {
    key: "rare_any",
    file: "rare_any_creatures_86-99-a8d7be2f-9f7d-4bcb-9f32-411589bdec28.png",
    pool: "src/data/creatures/pool_rare_wildcard.ts",
    expected: 14,
  },
  {
    key: "epic_fire",
    file: "epic_fire_creatures_100-112-a64a4675-007e-447d-aaf9-faaa3c85300d.png",
    pool: "src/data/creatures/pool_epic_fire.ts",
    expected: 13,
  },
  {
    key: "epic_water",
    file: "epic_water_creatures_113-125-60e0b128-36e3-4ddf-ad0a-e4433c9eb236.png",
    pool: "src/data/creatures/pool_epic_water.ts",
    expected: 13,
  },
  {
    key: "epic_electric",
    file: "epic_electric_creatures_138-149-bf1713ed-8c5d-401a-ad21-bf54e79c7df4.png",
    pool: "src/data/creatures/pool_epic_electric.ts",
    expected: 12,
  },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function percentile(values, p) {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  return values[Math.floor((values.length - 1) * p)];
}

function median(values) {
  return percentile(values, 0.5);
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

async function loadPoolNames(poolPath) {
  const text = await fs.readFile(poolPath, "utf8");
  // Pair each displayName with its netSlotIndex so naming follows sheet order
  // (catalog arrays are not always sorted — e.g. epic electric lists Zenith early).
  const names = [...text.matchAll(/displayName:\s*"([^"]+)"/g)].map((m) => m[1]);
  const slots = [...text.matchAll(/netSlotIndex:\s*(\d+)/g)].map((m) => Number(m[1]));
  if (names.length === slots.length) {
    return names
      .map((name, i) => ({ name, slot: slots[i] }))
      .sort((a, b) => a.slot - b.slot)
      .map((x) => x.name);
  }
  return names;
}

function estimatePaper(rgb, width, height) {
  // Rare/epic sheets have dark foxed borders — sample warm parchment from the
  // interior gutters between vignettes, not the burned outer edge.
  const candidates = [];
  const bands = [
    [0.08, 0.12, 0.15, 0.85], // top title gutter
    [0.45, 0.55, 0.05, 0.12], // left interior
    [0.45, 0.55, 0.88, 0.95], // right interior
    [0.88, 0.93, 0.2, 0.8], // bottom gutter above footer
  ];
  for (const [y0, y1, x0, x1] of bands) {
    const yStart = Math.floor(height * y0);
    const yEnd = Math.floor(height * y1);
    const xStart = Math.floor(width * x0);
    const xEnd = Math.floor(width * x1);
    for (let y = yStart; y < yEnd; y += 2) {
      for (let x = xStart; x < xEnd; x += 2) {
        const i = (y * width + x) * 3;
        const r = rgb[i];
        const g = rgb[i + 1];
        const b = rgb[i + 2];
        const light = (r + g + b) / 3;
        if (light > 165 && r >= g - 2 && g >= b && r - b > 20) candidates.push([r, g, b]);
      }
    }
  }
  if (candidates.length < 30) {
    return [220, 185, 140];
  }
  return [
    median(candidates.map((c) => c[0])),
    median(candidates.map((c) => c[1])),
    median(candidates.map((c) => c[2])),
  ];
}

/** Fixed reading-order grids shared by the rarity sheets. */
function layoutRows(expected) {
  if (expected === 14) return [5, 5, 4];
  if (expected === 13) return [5, 5, 3];
  if (expected === 12) return [4, 4, 4];
  if (expected === 30) return [6, 6, 6, 6, 6];
  return null;
}

function layoutCells(width, height, expected) {
  const rows = layoutRows(expected);
  if (!rows) return null;

  // Measured vignette midlines on the 1024×682 rare/epic sheets.
  const rowCenterY =
    rows.length === 3
      ? [0.165, 0.5, 0.79].map((t) => t * height)
      : rows.map((_, i) => ((i + 0.5) / rows.length) * height);

  // 5-column pitch shared by rare sheets; short bottom rows stay LEFT-aligned
  // (footer wax seal occupies the bottom-right, not a centered gap).
  const colCenterX =
    expected === 12
      ? [0.16, 0.39, 0.62, 0.75].map((t) => t * width)
      : [0.13, 0.285, 0.455, 0.62, 0.8].map((t) => t * width);

  const cellW = Math.round(width * (expected === 12 ? 0.2 : 0.17));
  const cellH = Math.round(height * 0.2);
  const cells = [];

  for (let r = 0; r < rows.length; r += 1) {
    const cols = rows[r];
    for (let c = 0; c < cols; c += 1) {
      const cx = colCenterX[c];
      const cy = rowCenterY[r];
      const left = clamp(Math.round(cx - cellW / 2), 0, width - cellW);
      const top = clamp(Math.round(cy - cellH / 2), 0, height - cellH);
      cells.push({
        left,
        top,
        width: cellW,
        height: cellH,
        cx,
        cy,
      });
    }
  }
  return cells;
}

/** Connected components on a binary mask → vignette-sized blobs. */
function maskToBlobs(mask, dw, dh, scale, width, height, minCount = 28) {
  const visited = new Uint8Array(dw * dh);
  const blobs = [];
  const queue = new Int32Array(dw * dh);

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    let qh = 0;
    let qt = 0;
    queue[qt++] = start;
    visited[start] = 1;
    let count = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = dw;
    let minY = dh;
    let maxX = 0;
    let maxY = 0;

    while (qh < qt) {
      const p = queue[qh++];
      const x = p % dw;
      const y = (p - x) / dw;
      count += 1;
      sumX += x;
      sumY += y;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (ox === 0 && oy === 0) continue;
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
          const np = ny * dw + nx;
          if (!mask[np] || visited[np]) continue;
          visited[np] = 1;
          queue[qt++] = np;
        }
      }
    }

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    if (count < minCount || bw < 10 || bh < 6) continue;
    // Reject row-spanning merges (electric glow can bridge neighboring plates).
    if (bw > dw * 0.28 || bh > dh * 0.32) continue;
    const cx = (sumX / count) * scale;
    const cy = (sumY / count) * scale;
    // Drop wax-seal / footer badge / pinned note in the lower-right corner.
    if (cx > width * 0.84 && cy > height * 0.68) continue;
    blobs.push({
      cx,
      cy,
      left: minX * scale,
      top: minY * scale,
      right: (maxX + 1) * scale,
      bottom: (maxY + 1) * scale,
      area: count * scale * scale,
    });
  }
  return blobs;
}

/**
 * Detect creature plates: dark indigo vignettes (primary) plus warm paint
 * islands for bright plates that sit on parchment (e.g. Ember Guppy).
 */
function detectVignetteCells(rgb, width, height, paper, expected) {
  const scale = 4; // detect on 1/4 resolution for speed
  const dw = Math.floor(width / scale);
  const dh = Math.floor(height / scale);
  const darkMask = new Uint8Array(dw * dh);
  const chromaMask = new Uint8Array(dw * dh);

  const paperLight = (paper[0] + paper[1] + paper[2]) / 3;
  for (let y = 0; y < dh; y += 1) {
    for (let x = 0; x < dw; x += 1) {
      const sx = Math.min(width - 1, x * scale + Math.floor(scale / 2));
      const sy = Math.min(height - 1, y * scale + Math.floor(scale / 2));
      const i = (sy * width + sx) * 3;
      const r = rgb[i];
      const g = rgb[i + 1];
      const b = rgb[i + 2];
      const light = (r + g + b) / 3;
      const paperDist =
        Math.abs(r - paper[0]) + Math.abs(g - paper[1]) + Math.abs(b - paper[2]);
      const inArtBand = y > dh * 0.11 && y < dh * 0.88 && x > dw * 0.02 && x < dw * 0.98;
      if (!inArtBand) continue;

      const darker = paperLight - light > 38;
      if (darker && paperDist > 50 && light < paperLight - 22) {
        darkMask[y * dw + x] = 1;
      }

      // Bright creature paint on parchment when the indigo wash is weak/absent.
      const warm =
        r > 150 &&
        r > g + 15 &&
        r > b + 25 &&
        light > 70 &&
        light < paperLight - 8 &&
        paperDist > 35;
      const cool =
        b > 130 &&
        b > r + 10 &&
        (b > g - 5 || g > r + 5) &&
        light > 70 &&
        light < paperLight - 6 &&
        paperDist > 30;
      if (warm || cool) chromaMask[y * dw + x] = 1;
    }
  }

  const darkBlobs = maskToBlobs(darkMask, dw, dh, scale, width, height, 28);
  const chromaBlobs = maskToBlobs(chromaMask, dw, dh, scale, width, height, 18);
  // Prefer dark plates; add chroma islands only when they don't overlap a dark one.
  const blobs = [...darkBlobs];
  for (const chroma of chromaBlobs) {
    const overlapsDark = darkBlobs.some(
      (d) => Math.hypot(d.cx - chroma.cx, d.cy - chroma.cy) < 70,
    );
    if (!overlapsDark) blobs.push(chroma);
  }

  if (blobs.length === 0) {
    throw new Error("No vignette blobs detected");
  }

  // Seed expected slots from the reading-order grid, then snap each slot to
  // the nearest dark vignette. Gaps (bright plates like Ember Guppy) keep the
  // layout crop so catalog order stays correct.
  const seeds = layoutCells(width, height, expected);
  if (!seeds) {
    throw new Error(`No layout seeds for expected=${expected}`);
  }

  const maxAssignDist = Math.max(width, height) * 0.12;
  const assigned = seeds.map(() => null);

  // Nearest-seed first (not largest-first): preserves reading-order columns when
  // two vignettes compete for the same approximate slot.
  const free = [...blobs];
  for (let i = 0; i < seeds.length; i += 1) {
    let best = -1;
    let bestDist = Infinity;
    for (let b = 0; b < free.length; b += 1) {
      const blob = free[b];
      // Never assign the footer wax seal / pinned note into a creature slot.
      if (blob.cx > width * 0.84 && blob.cy > height * 0.68) continue;
      const dist = Math.hypot(blob.cx - seeds[i].cx, blob.cy - seeds[i].cy);
      if (dist < bestDist) {
        bestDist = dist;
        best = b;
      }
    }
    if (best >= 0 && bestDist <= maxAssignDist) {
      assigned[i] = free[best];
      free.splice(best, 1);
    }
  }

  if (process.env.DEBUG_VIGNETTE === "1") {
    const filled = assigned.filter(Boolean).length;
    console.warn(
      `  [debug] paper=${paper.join(",")} blobs=${blobs.length} slotted=${filled}/${expected}`,
    );
  }

  const slotted = assigned.filter(Boolean).length;
  if (slotted < Math.floor(expected * 0.6)) {
    throw new Error(
      `Expected ~${expected} vignettes, only slotted ${slotted} (raw ${blobs.length})`,
    );
  }

  // Expand each vignette to include glow / particles / soft watercolor bloom.
  // Tiny/misplaced warm fragments (title ink) get replaced by a local paint search.
  return seeds.map((seed, i) => {
    let cell = assigned[i];
    const weak =
      !cell ||
      cell.area < 3500 ||
      Math.hypot(cell.cx - seed.cx, cell.cy - seed.cy) > maxAssignDist * 0.85;
    if (weak) {
      cell = localPaintCell(rgb, width, height, paper, seed) || cell;
    }
    if (!cell) return { ...seed };

    const vw = cell.right - cell.left;
    const vh = cell.bottom - cell.top;
    const padX = Math.max(14, Math.round(vw * 0.28));
    const padY = Math.max(12, Math.round(vh * 0.3));
    const left = clamp(Math.round(cell.left - padX), 0, width - 8);
    const top = clamp(Math.round(cell.top - padY), 0, height - 8);
    const right = clamp(Math.round(cell.right + padX), left + 8, width);
    const bottom = clamp(Math.round(cell.bottom + padY), top + 8, height);
    return {
      left,
      top,
      width: right - left,
      height: bottom - top,
      cx: (left + right) / 2,
      cy: (top + bottom) / 2,
    };
  });
}

/** Search near a layout seed for non-paper paint when blob detection misses. */
function localPaintCell(rgb, width, height, paper, seed) {
  const paperLight = (paper[0] + paper[1] + paper[2]) / 3;
  const winW = Math.round(width * 0.14);
  const winH = Math.round(height * 0.14);
  // Bias the window slightly downward — titles/seals sit above the paint plate.
  const left0 = clamp(Math.round(seed.cx - winW / 2), 0, width - winW);
  const top0 = clamp(Math.round(seed.cy - winH * 0.35), 0, height - winH);

  // Prefer chroma paint (bright creatures on parchment). Fall back to dark.
  const collect = (mode) => {
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let sumX = 0;
    let sumY = 0;
    let weightSum = 0;

    for (let y = top0; y < top0 + winH; y += 1) {
      for (let x = left0; x < left0 + winW; x += 1) {
        const i = (y * width + x) * 3;
        const r = rgb[i];
        const g = rgb[i + 1];
        const b = rgb[i + 2];
        const light = (r + g + b) / 3;
        const paperDist =
          Math.abs(r - paper[0]) + Math.abs(g - paper[1]) + Math.abs(b - paper[2]);
        const dark = paperLight - light > 32 && paperDist > 42;
        const warm =
          r > 160 &&
          r > g + 18 &&
          r > b + 28 &&
          light > 60 &&
          light < paperLight + 5 &&
          paperDist > 30;
        const cool =
          b > 135 &&
          b > r + 8 &&
          light > 60 &&
          light < paperLight + 5 &&
          paperDist > 28;
        if (mode === "chroma" && !(warm || cool)) continue;
        if (mode === "dark" && !dark) continue;
        // Distance weight keeps title botanicals from stealing the centroid.
        const dist = Math.hypot(x - seed.cx, y - seed.cy);
        const w = 1 / (1 + dist / 28);
        weightSum += w;
        sumX += x * w;
        sumY += y * w;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (weightSum < 40) return null;
    const cx = sumX / weightSum;
    const cy = sumY / weightSum;
    const halfW = clamp(Math.round((maxX - minX + 1) * 0.5), 40, Math.round(winW * 0.55));
    const halfH = clamp(Math.round((maxY - minY + 1) * 0.5), 32, Math.round(winH * 0.55));
    return {
      cx,
      cy,
      left: clamp(Math.round(cx - halfW), 0, width - 8),
      top: clamp(Math.round(cy - halfH), 0, height - 8),
      right: clamp(Math.round(cx + halfW), 8, width),
      bottom: clamp(Math.round(cy + halfH), 8, height),
      area: weightSum * 20,
    };
  };

  return collect("chroma") || collect("dark");
}

function createAlphaMatte(rgb, width, height, paper, noiseFloor = 0.14) {
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
    if (alpha <= noiseFloor) alpha = 0;
    else if (alpha < noiseFloor + 0.03) {
      const t = (alpha - noiseFloor) / 0.03;
      alpha *= t * t * (3 - 2 * t);
    }
    rawAlpha[p] = alpha;
  }

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
          const n = rawAlpha[(y + oy) * width + (x + ox)];
          if (n > noiseFloor) support += 1;
          maxNeighbor = Math.max(maxNeighbor, n);
        }
      }
      if (support === 0) refined[p] = 0;
      else if (support >= 3) refined[p] = Math.max(a, maxNeighbor * 0.22);
    }
  }

  // Soft superellipse keeps sheet rules / botanical sketches out of the crop.
  const smoothstep = (t) => {
    const v = clamp(t, 0, 1);
    return v * v * (3 - 2 * v);
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x;
      const nx = Math.abs((x - (width - 1) * 0.5) / (width * 0.5));
      const ny = Math.abs((y - (height - 1) * 0.5) / (height * 0.55));
      const dist = Math.sqrt(nx * nx + ny * ny);
      const vignette = 1 - smoothstep((dist - 0.78) / 0.2);
      const edge =
        smoothstep(Math.min(x, width - 1 - x) / (width * 0.06)) *
        smoothstep(Math.min(y, height - 1 - y) / (height * 0.08));
      refined[p] *= vignette * edge;
    }
  }

  // Keep only the dominant painted island (vignette + creature). This drops
  // lesson copy, title fragments, and detached botanical ink outside the plate.
  keepLargestIsland(refined, width, height, 0.12);

  for (let p = 0; p < width * height; p += 1) {
    const i = p * 3;
    const o = p * 4;
    const alpha = refined[p];
    if (alpha <= 0) {
      rgba[o] = rgba[o + 1] = rgba[o + 2] = rgba[o + 3] = 0;
      continue;
    }
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

function keepLargestIsland(alpha, width, height, threshold) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let bestLabel = -1;
  let bestCount = 0;
  const labels = new Int32Array(width * height);
  let label = 0;

  for (let start = 0; start < alpha.length; start += 1) {
    if (alpha[start] < threshold || visited[start]) continue;
    label += 1;
    let count = 0;
    let qh = 0;
    let qt = 0;
    queue[qt++] = start;
    visited[start] = 1;
    while (qh < qt) {
      const p = queue[qh++];
      labels[p] = label;
      count += 1;
      const x = p % width;
      const y = (p - x) / width;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (ox === 0 && oy === 0) continue;
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const np = ny * width + nx;
          if (visited[np] || alpha[np] < threshold) continue;
          visited[np] = 1;
          queue[qt++] = np;
        }
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestLabel = label;
    }
  }

  if (bestLabel < 0) return;
  for (let p = 0; p < alpha.length; p += 1) {
    if (labels[p] !== 0 && labels[p] !== bestLabel) alpha[p] = 0;
  }
}

function findPaintBounds(alpha, width, height) {
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

async function buildContactSheet(assets, background, outputPath) {
  const cellWidth = 160;
  const cellHeight = 120;
  const columns = Math.min(5, Math.max(3, Math.ceil(Math.sqrt(assets.length))));
  const rows = Math.ceil(assets.length / columns);
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
  for (let i = 0; i < assets.length; i += 1) {
    const { path: assetPath, name } = assets[i];
    const meta = await sharp(assetPath).metadata();
    const scale = Math.min(1, (cellWidth - 16) / meta.width, 78 / meta.height);
    const w = Math.max(1, Math.round(meta.width * scale));
    const h = Math.max(1, Math.round(meta.height * scale));
    const resized = await sharp(assetPath).resize(w, h, { kernel: "nearest" }).png().toBuffer();
    const x = (i % columns) * cellWidth;
    const y = Math.floor(i / columns) * cellHeight;
    composites.push({
      input: resized,
      left: x + Math.floor((cellWidth - w) / 2),
      top: y + 6 + Math.floor((78 - h) / 2),
    });
    const label = name.length > 18 ? `${name.slice(0, 16)}…` : name;
    composites.push({
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${cellWidth}" height="24"><text x="${cellWidth / 2}" y="16" text-anchor="middle" font-family="sans-serif" font-size="10" fill="${background === "dark" ? "#f1e5d5" : "#46372d"}">${label.replaceAll("_", " ")}</text></svg>`,
      ),
      left: x,
      top: y + 92,
    });
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await base.composite(composites).png({ compressionLevel: 9 }).toFile(outputPath);
}

async function extractSheet(sheet) {
  const sourcePath = path.join(ASSETS, sheet.file);
  const names = await loadPoolNames(sheet.pool);
  if (names.length !== sheet.expected) {
    throw new Error(
      `${sheet.key}: pool has ${names.length} names, expected ${sheet.expected}`,
    );
  }

  // Must be 3-channel RGB. ensureAlpha()+removeAlpha() can leave a 4-channel
  // buffer while reporting RGB indexing assumptions — that breaks detection.
  const { data: rgb, info } = await sharp(sourcePath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== 1024 || info.height !== 682) {
    throw new Error(
      `${sheet.key}: unexpected size ${info.width}×${info.height} (expected 1024×682)`,
    );
  }
  if (info.channels !== 3) {
    throw new Error(`${sheet.key}: expected 3-channel RGB, got ${info.channels}`);
  }

  const paper = estimatePaper(rgb, info.width, info.height);
  // Blob detection is primary for rare/epic (dark vignette plates). Layout is fallback.
  let cells;
  try {
    cells = detectVignetteCells(rgb, info.width, info.height, paper, sheet.expected);
  } catch (err) {
    cells = layoutCells(info.width, info.height, sheet.expected);
    if (!cells) throw err;
    console.warn(`  vignette detect failed (${err.message}); using layout fallback`);
  }
  const exported = [];
  const review = [];

  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    const name = slugify(names[i]);
    const { data: cellRgb, info: cellInfo } = await sharp(sourcePath)
      .extract({
        left: cell.left,
        top: cell.top,
        width: cell.width,
        height: cell.height,
      })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const localPaper = estimatePaper(cellRgb, cellInfo.width, cellInfo.height);
    const noiseFloor = 0.13;
    const { rgba, alpha } = createAlphaMatte(
      cellRgb,
      cellInfo.width,
      cellInfo.height,
      localPaper,
      noiseFloor,
    );
    const bounds = findPaintBounds(alpha, cellInfo.width, cellInfo.height);
    const outPath = path.join(OUTPUT, `${name}.png`);

    await sharp(rgba, {
      raw: { width: cellInfo.width, height: cellInfo.height, channels: 4 },
    })
      .extract(bounds)
      .withIccProfile("srgb")
      .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
      .toFile(outPath);

    const alphaValues = Array.from(alpha);
    const visible = alphaValues.filter((a) => a > 6 / 255).length;
    const opaque = alphaValues.filter((a) => a > 0.95).length;
    if (opaque === 0 || visible < 400) {
      review.push({
        file: `${name}.png`,
        reason:
          opaque === 0
            ? "Fully translucent watercolor wash — inspect on dark UI surfaces"
            : "Low visible paint area after matte",
      });
    }

    exported.push({
      path: outPath,
      name,
      displayName: names[i],
      sourceRect: cell,
      visiblePixels: visible,
    });
  }

  const qaDir = path.join(QA_ROOT, sheet.key);
  await fs.mkdir(qaDir, { recursive: true });
  await buildContactSheet(exported, "checker", path.join(qaDir, "checker.png"));
  await buildContactSheet(exported, "warm", path.join(qaDir, "warm.png"));
  await buildContactSheet(exported, "dark", path.join(qaDir, "dark.png"));
  await fs.writeFile(
    path.join(qaDir, "manifest.json"),
    `${JSON.stringify(
      {
        sheet: sheet.key,
        source: sheet.file,
        paper,
        count: exported.length,
        exports: exported.map(({ name, displayName, sourceRect, visiblePixels }) => ({
          name,
          displayName,
          sourceRect,
          visiblePixels,
        })),
        review,
      },
      null,
      2,
    )}\n`,
  );

  return { sheet: sheet.key, count: exported.length, review, names: exported.map((e) => e.name) };
}

async function main() {
  const only = process.argv.find((a) => a.startsWith("--sheet="))?.slice("--sheet=".length);
  const selected = only ? SHEETS.filter((s) => s.key === only) : SHEETS;
  if (selected.length === 0) {
    throw new Error(`No sheet matched ${only}`);
  }

  await fs.mkdir(OUTPUT, { recursive: true });
  const results = [];
  for (const sheet of selected) {
    process.stdout.write(`Extracting ${sheet.key}… `);
    const result = await extractSheet(sheet);
    console.log(`${result.count} assets (${result.review.length} review flags)`);
    results.push(result);
  }

  // Rebuild the batch section from every sheet manifest so single-sheet runs
  // don't wipe notes for the other families.
  const reviewPath = path.join(OUTPUT, "manual_review.md");
  let existing = "";
  try {
    existing = await fs.readFile(reviewPath, "utf8");
  } catch {
    existing = "# Creature Asset Manual Review\n";
  }

  const sectionStart = "\n## Batch extraction — rare & epic sheets\n";
  const before = existing.includes(sectionStart)
    ? existing.slice(0, existing.indexOf(sectionStart))
    : existing.trimEnd();
  const lines = [
    sectionStart,
    "",
    "Pipeline: layout seeds → dark/chroma vignette snap → paper color-to-alpha.",
    "No resize / sharpen / recolor / regenerate. Names follow catalog `displayName`",
    "sorted by `netSlotIndex`. QA: `.qa/creature-assets/<sheet>/checker.png`",
    "",
  ];
  for (const sheet of SHEETS) {
    const manifestPath = path.join(QA_ROOT, sheet.key, "manifest.json");
    let manifest;
    try {
      manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    } catch {
      const live = results.find((r) => r.sheet === sheet.key);
      if (!live) continue;
      manifest = {
        count: live.count,
        exports: live.names.map((name) => ({ name })),
        review: live.review,
      };
    }
    lines.push(`### ${sheet.key} (${manifest.count})`);
    lines.push("");
    lines.push(
      `Files: ${manifest.exports.map((e) => `\`${e.name}.png\``).join(", ")}`,
    );
    lines.push("");
    if (!manifest.review?.length) {
      lines.push("Auto review flags: none.");
    } else {
      for (const item of manifest.review) {
        lines.push(`- \`${item.file}\` — ${item.reason}`);
      }
    }
    lines.push("");
  }
  lines.push("### Known manual QA notes");
  lines.push("");
  lines.push(
    "- Sheet printed names often differ from catalog names (e.g. sheet “Tide Darter” → `tide_whisper`).",
  );
  lines.push(
    "- Pale wind/water washes may be fully translucent — expected; check on dark UI.",
  );
  lines.push(
    "- Inspect top-left slots (`tide_whisper`, `breath_dart`, `lightning_elder`) for title/botanical bleed.",
  );
  lines.push(
    "- Residual lesson-text / botanical flecks may remain where they touch the vignette.",
  );
  lines.push("");
  await fs.writeFile(reviewPath, `${before.trimEnd()}\n${lines.join("\n")}\n`);

  console.log(`\nDone. Assets → ${OUTPUT}`);
  console.log(`QA → ${QA_ROOT}`);
}

await main();
