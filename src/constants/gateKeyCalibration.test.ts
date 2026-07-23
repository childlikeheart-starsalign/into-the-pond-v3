import assert from "node:assert/strict";
import test from "node:test";

import {
  clampGateKeyCalibration,
  GATE_KEY_DEFAULT,
  isGateKeyCalibrationOnScreen,
  parseGateKeyCalibration,
} from "./gateKeyCalibration";

test("parseGateKeyCalibration accepts on-screen defaults", () => {
  const parsed = parseGateKeyCalibration({ ...GATE_KEY_DEFAULT });
  assert.ok(parsed);
  assert.equal(parsed!.leftPct, GATE_KEY_DEFAULT.leftPct);
  assert.equal(parsed!.topPct, GATE_KEY_DEFAULT.topPct);
});

test("parseGateKeyCalibration rejects near-zero corrupt calibration", () => {
  assert.equal(parseGateKeyCalibration({ leftPct: 0.01, topPct: 0.02 }), null);
  assert.equal(parseGateKeyCalibration({ leftPct: 0.9, topPct: 0.5 }), null);
});

test("clampGateKeyCalibration keeps values in band", () => {
  const clamped = clampGateKeyCalibration({ leftPct: 0.01, topPct: 0.99 });
  assert.ok(isGateKeyCalibrationOnScreen(clamped));
  assert.equal(clamped.leftPct, 0.15);
  assert.equal(clamped.topPct, 0.85);
});
