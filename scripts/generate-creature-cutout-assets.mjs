/**
 * Regenerates src/features/fishing/creatureCutoutAssets.ts from
 * assets/Fishing/creatureCutouts/*.png
 *
 * Path must match on-disk casing (`Fishing`, not `fishing`) — Metro resolves case-sensitively.
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("assets/Fishing/creatureCutouts");
const out = path.resolve("src/features/fishing/creatureCutoutAssets.ts");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
const lines = [
  "/**",
  " * Generated Metro require map for creature cutout PNGs.",
  " * Regenerate: node scripts/generate-creature-cutout-assets.mjs",
  " * Requires use assets/Fishing (capital F) to match on-disk casing.",
  " */",
  'import type { ImageSourcePropType } from "react-native";',
  "",
  "export const CREATURE_CUTOUT_ASSETS: Record<string, ImageSourcePropType> = {",
];
for (const file of files) {
  const slug = file.replace(/\.png$/, "");
  lines.push(`  ${JSON.stringify(slug)}: require("@/assets/Fishing/creatureCutouts/${file}"),`);
}
lines.push("};");
lines.push("");
fs.writeFileSync(out, `${lines.join("\n")}\n`);
console.log(`Wrote ${files.length} cutouts → ${out}`);
