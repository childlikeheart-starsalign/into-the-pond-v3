/** Default center position on the full-screen gate (0–1 of screen width/height). */
export const GATE_KEY_DEFAULT = {
  leftPct: 0.305,
  topPct: 0.546,
} as const;

/** Fraction of screen width used for the animated gate key overlay. */
export const GATE_KEY_WIDTH_RATIO = 0.28;

/** Reject / clamp calibration outside this band so the key stays on-screen. */
export const GATE_KEY_CALIBRATION_PCT_MIN = 0.15;
export const GATE_KEY_CALIBRATION_PCT_MAX = 0.85;

export type GateKeyCalibration = {
  leftPct: number;
  topPct: number;
  widthRatio?: number;
};

function clampCalibrationPct(value: number): number {
  return Math.min(GATE_KEY_CALIBRATION_PCT_MAX, Math.max(GATE_KEY_CALIBRATION_PCT_MIN, value));
}

export function isGateKeyCalibrationOnScreen(calibration: GateKeyCalibration): boolean {
  return (
    calibration.leftPct >= GATE_KEY_CALIBRATION_PCT_MIN &&
    calibration.leftPct <= GATE_KEY_CALIBRATION_PCT_MAX &&
    calibration.topPct >= GATE_KEY_CALIBRATION_PCT_MIN &&
    calibration.topPct <= GATE_KEY_CALIBRATION_PCT_MAX
  );
}

export function clampGateKeyCalibration(calibration: GateKeyCalibration): GateKeyCalibration {
  return {
    leftPct: clampCalibrationPct(calibration.leftPct),
    topPct: clampCalibrationPct(calibration.topPct),
    ...(calibration.widthRatio != null ? { widthRatio: calibration.widthRatio } : {}),
  };
}

export function parseGateKeyCalibration(raw: unknown): GateKeyCalibration | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Record<string, unknown>;
  if (typeof parsed.leftPct !== "number" || typeof parsed.topPct !== "number") {
    return null;
  }
  if (!Number.isFinite(parsed.leftPct) || !Number.isFinite(parsed.topPct)) {
    return null;
  }
  const widthRatio = typeof parsed.widthRatio === "number" ? parsed.widthRatio : undefined;
  const calibration: GateKeyCalibration = {
    leftPct: parsed.leftPct,
    topPct: parsed.topPct,
    ...(widthRatio != null ? { widthRatio } : {}),
  };
  if (!isGateKeyCalibrationOnScreen(calibration)) {
    return null;
  }
  return calibration;
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
