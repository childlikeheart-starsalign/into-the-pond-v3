import { Image, type ImageSourcePropType } from "react-native";

import { media } from "@/src/constants/media";

/** Fraction of screen width used for the animated gate key overlay (matches ~28% artboard key width). */
export const GATE_KEY_WIDTH_RATIO = 0.28;

/** Default center position on the full-screen gate (0–1 of screen width/height). */
export const GATE_KEY_DEFAULT = {
  leftPct: 0.305,
  topPct: 0.546,
} as const;

export type GateKeyCalibration = {
  leftPct: number;
  topPct: number;
  widthRatio?: number;
};

const LEGACY_STORAGE_KEY = "gate.keyBox.v1";
/** Previous calibration bucket — cleared when keyless splash shipped. */
export const PREVIOUS_GATE_KEY_STORAGE_KEY = "gate.keyBox.v2";
export const GATE_KEY_STORAGE_KEY = "gate.keyBox.v3";

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

export function resolveGateKeySize(
  screenWidth: number,
  widthRatio: number,
  intrinsicWidth: number,
  intrinsicHeight: number,
): { width: number; height: number } {
  if (screenWidth <= 0 || intrinsicWidth <= 0) {
    return { width: 0, height: 0 };
  }
  const width = screenWidth * widthRatio;
  const height = width * (intrinsicHeight / intrinsicWidth);
  return { width, height };
}

export function resolveGateKeyPosition(
  screenWidth: number,
  screenHeight: number,
  calibration: GateKeyCalibration,
  keySize: { width: number; height: number },
): { left: number; top: number } {
  const centerX = screenWidth * calibration.leftPct;
  const centerY = screenHeight * calibration.topPct;
  return {
    left: centerX - keySize.width / 2,
    top: centerY - keySize.height / 2,
  };
}

export function parseGateKeyCalibration(raw: unknown): GateKeyCalibration | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Record<string, unknown>;
  if (typeof parsed.leftPct !== "number" || typeof parsed.topPct !== "number") {
    return null;
  }
  const widthRatio = typeof parsed.widthRatio === "number" ? parsed.widthRatio : undefined;
  return {
    leftPct: parsed.leftPct,
    topPct: parsed.topPct,
    ...(widthRatio != null ? { widthRatio } : {}),
  };
}

export { LEGACY_STORAGE_KEY };
