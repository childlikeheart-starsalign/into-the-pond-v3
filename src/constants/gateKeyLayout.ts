import { Image, type ImageSourcePropType } from "react-native";

import {
  clampGateKeyCalibration,
  GATE_KEY_CALIBRATION_PCT_MAX,
  GATE_KEY_CALIBRATION_PCT_MIN,
  GATE_KEY_DEFAULT,
  GATE_KEY_WIDTH_RATIO,
  isGateKeyCalibrationOnScreen,
  parseGateKeyCalibration,
  resolveGateKeyPosition,
  resolveGateKeySize,
  type GateKeyCalibration,
} from "@/src/constants/gateKeyCalibration";
import { media } from "@/src/constants/media";

export {
  clampGateKeyCalibration,
  GATE_KEY_CALIBRATION_PCT_MAX,
  GATE_KEY_CALIBRATION_PCT_MIN,
  GATE_KEY_DEFAULT,
  GATE_KEY_WIDTH_RATIO,
  isGateKeyCalibrationOnScreen,
  parseGateKeyCalibration,
  resolveGateKeyPosition,
  resolveGateKeySize,
  type GateKeyCalibration,
};

const LEGACY_STORAGE_KEY = "gate.keyBox.v1";
/** Cleared on load — superseded by v4 after bad relative-coordinate calibrations. */
export const PREVIOUS_GATE_KEY_STORAGE_KEY = "gate.keyBox.v3";
/** Older buckets also cleared on DEV load. */
export const STALE_GATE_KEY_STORAGE_KEYS = [
  LEGACY_STORAGE_KEY,
  "gate.keyBox.v2",
  PREVIOUS_GATE_KEY_STORAGE_KEY,
] as const;
export const GATE_KEY_STORAGE_KEY = "gate.keyBox.v4";

/** Resolved intrinsic size from Metro bundle metadata. */
export function resolveGateKeyIntrinsic(): { width: number; height: number } {
  const resolveFn =
    typeof Image.resolveAssetSource === "function"
      ? (Image.resolveAssetSource as (src: ImageSourcePropType) => {
          width?: number;
          height?: number;
        })
      : undefined;

  if (!resolveFn) {
    return { width: 133, height: 46 };
  }

  const resolved = resolveFn(media.gate.key);
  return {
    width: resolved.width ?? 133,
    height: resolved.height ?? 46,
  };
}

export { LEGACY_STORAGE_KEY };
