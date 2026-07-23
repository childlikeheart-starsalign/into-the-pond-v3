import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { getCreatureByTypeId } from "@/src/data/creatures/helpers";
import {
  COMMON_CUTOUT_ALIASES,
  CREATURE_CUTOUT_GAPS,
  cutoutSlugForCreature,
  slugifyCreatureDisplayName,
} from "@/src/features/fishing/creatureCutoutAliases";

const CUTOUT_DIR = path.resolve("assets/Fishing/creatureCutouts");

function cutoutFileExists(slug: string): boolean {
  return fs.existsSync(path.join(CUTOUT_DIR, `${slug}.png`));
}

test("getCreatureByTypeId returns catalog creatures", () => {
  const puddle = getCreatureByTypeId("puddle-dart");
  assert.ok(puddle);
  assert.equal(puddle!.displayName, "Puddle Dart");
  assert.equal(getCreatureByTypeId("missing-id"), null);
  assert.equal(getCreatureByTypeId(null), null);
});

test("common cutout aliases map sheet filenames to catalog slugs", () => {
  assert.equal(COMMON_CUTOUT_ALIASES.reed_tail, "whisper_minnow");
  assert.equal(COMMON_CUTOUT_ALIASES.dusk_mote, "dreamweaver");
  const reed = getCreatureByTypeId("reed-tail");
  assert.ok(reed);
  assert.equal(cutoutSlugForCreature(reed!), "whisper_minnow");
  assert.ok(cutoutFileExists("whisper_minnow"));
});

test("direct catalog slug has cutout file when art exists", () => {
  assert.ok(cutoutFileExists("puddle_dart"));
  assert.ok(cutoutFileExists("ember_darter"));
  assert.ok(cutoutFileExists("magma_elder"));
  assert.equal(cutoutSlugForCreature(getCreatureByTypeId("ember-darter")!), "ember_darter");
});

test("epic wind gaps are documented and lack cutout files", () => {
  assert.ok(CREATURE_CUTOUT_GAPS.includes("gale-witness"));
  for (const id of CREATURE_CUTOUT_GAPS) {
    const creature = getCreatureByTypeId(id);
    assert.ok(creature, `expected catalog entry for ${id}`);
    assert.equal(cutoutFileExists(cutoutSlugForCreature(creature!)), false);
  }
});

test("slugifyCreatureDisplayName matches extract naming", () => {
  assert.equal(slugifyCreatureDisplayName("Puddle Dart"), "puddle_dart");
  assert.equal(slugifyCreatureDisplayName("Resonant Sovereign"), "resonant_sovereign");
});

test("all common aliases point at existing cutout files", () => {
  for (const [catalogSlug, sheetSlug] of Object.entries(COMMON_CUTOUT_ALIASES)) {
    assert.ok(cutoutFileExists(sheetSlug), `alias ${catalogSlug} → ${sheetSlug}.png missing`);
  }
});
