import { Easing, Extrapolation, interpolate } from "react-native-reanimated";

/** Deliberate flip — not interactive drag rotation. */
export const CARD_FLIP_DURATION_MS = 550;

export const CARD_FLIP_EASING = Easing.inOut(Easing.ease);

/** Minimum horizontal drag before a swipe commits a flip. */
export const CARD_FLIP_SWIPE_THRESHOLD_PX = 40;

const MID_START = 75;
const MID_END = 105;

export function frontFaceOpacity(rotationDeg: number): number {
  "worklet";
  return interpolate(rotationDeg, [0, MID_START, MID_END, 180], [1, 1, 0, 0], Extrapolation.CLAMP);
}

export function backFaceOpacity(rotationDeg: number): number {
  "worklet";
  return interpolate(rotationDeg, [0, MID_START, MID_END, 180], [0, 0, 1, 1], Extrapolation.CLAMP);
}

export function frontFaceRotateY(rotationDeg: number): string {
  "worklet";
  return `${interpolate(rotationDeg, [0, 180], [0, 180])}deg`;
}

export function backFaceRotateY(rotationDeg: number): string {
  "worklet";
  return `${interpolate(rotationDeg, [0, 180], [180, 360])}deg`;
}
