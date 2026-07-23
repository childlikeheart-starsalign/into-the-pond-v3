import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPondSessionRoute } from "@/src/services/audio/eveningPondSessionRoutes";

describe("isPondSessionRoute", () => {
  it("keeps evening-pond on prologue Part 1 without uid", () => {
    assert.equal(isPondSessionRoute("/prologue", null), true);
  });

  it("keeps evening-pond on prologue Part 2 with or without uid", () => {
    assert.equal(isPondSessionRoute("/prologue-continuation", null), true);
    assert.equal(isPondSessionRoute("/prologue-continuation", "uid-1"), true);
  });

  it("still requires uid for main app routes", () => {
    assert.equal(isPondSessionRoute("/sanctuary", null), false);
    assert.equal(isPondSessionRoute("/sanctuary", "uid-1"), true);
  });

  it("excludes auth routes", () => {
    assert.equal(isPondSessionRoute("/signup", null), false);
    assert.equal(isPondSessionRoute("/signup", "uid-1"), false);
    assert.equal(isPondSessionRoute("/login", "uid-1"), false);
  });
});
