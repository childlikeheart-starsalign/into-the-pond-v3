import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveDisplayArchetypeName,
  scoreQuickCheckTally,
} from "../../shared/childProfile/archetypeQuickCheck";
import { resolvePondGateDialogueScene } from "../data/dialogues";

test("quick check majority storm → Storm Child", () => {
  const scored = scoreQuickCheckTally(["storm", "storm", "wall", "storm", "spark"]);
  assert.equal(scored.primaryArchetype, "storm");
  assert.equal(scored.tieOccurred, false);
  assert.equal(scored.displayArchetypeName, "Storm Child");
});

test("quick check tie uses most-recent question for primary", () => {
  // 2 storm, 2 wall, 1 spark — majority? No — storm/wall tied at 2, last of the leaders...
  // answers: storm, wall, storm, wall, spark → counts storm2 wall2 spark1; leaders storm+wall; last in reverse that is leader = wall
  const scored = scoreQuickCheckTally(["storm", "wall", "storm", "wall", "spark"]);
  assert.equal(scored.tieOccurred, true);
  assert.equal(scored.primaryArchetype, "wall");
  assert.deepEqual(scored.tiedArchetypes, ["storm", "wall"]);
  assert.equal(scored.displayArchetypeName, "Quiet Storm");
});

test("three-way display name → Weather Child", () => {
  assert.equal(
    resolveDisplayArchetypeName({
      primaryArchetype: "spark",
      tieOccurred: true,
      tiedArchetypes: ["storm", "wall", "spark"],
    }),
    "Weather Child",
  );
});

test("pond gate helper returns locked until lessons 1.1–1.3 complete", () => {
  assert.equal(
    resolvePondGateDialogueScene({
      completedLessons: { "1.1": true, "1.2": true },
      basicRodState: null,
    }),
    "pond_locked",
  );
  assert.equal(
    resolvePondGateDialogueScene({
      completedLessons: { "1.1": true, "1.2": true, "1.3": true },
      basicRodState: "locked",
    }),
    "pond_unlocked_no_rod",
  );
  assert.equal(
    resolvePondGateDialogueScene({
      completedLessons: { "1.1": true, "1.2": true, "1.3": true },
      basicRodState: "ready",
    }),
    null,
  );
});
