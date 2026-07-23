import {
  HEADER_COMPOSITE_BAND_HEIGHT,
  HEADER_COMPOSITE_LAYOUT,
  HEADER_OPTICAL_OFFSETS,
  type HeaderCompositeOpticalKey,
  type OpticalOffset,
} from "@/src/features/sanctuary/sanctuaryHeaderLayout";

export const SANCTUARY_HEADER_TUNING_STORAGE_KEY = "sanctuary-header-tuning-dev-v10";

export type SanctuaryHeaderTuningTarget =
  | "overlay"
  | "month"
  | "wonderBottle"
  | "wonderCount"
  | "childName"
  | "settings"
  | "avatar";

export type SanctuaryHeaderSlotKey = Exclude<SanctuaryHeaderTuningTarget, "overlay">;

export type HeaderOverlayTuning = {
  offsetX: number;
  offsetY: number;
  scale: number;
  topCropPt: number;
  bottomCropPt: number;
};

export type SanctuaryHeaderTuningState = {
  overlay: HeaderOverlayTuning;
  bandHeight: number;
  avatarCenterY: number;
  /** Extra optical offsets added on top of HEADER_OPTICAL_OFFSETS. */
  slotOffsets: Record<SanctuaryHeaderSlotKey, OpticalOffset>;
};

const SLOT_TO_OPTICAL: Record<SanctuaryHeaderSlotKey, HeaderCompositeOpticalKey> = {
  month: "month",
  wonderBottle: "wonderBottle",
  wonderCount: "wonderCount",
  childName: "childName",
  settings: "settings",
  avatar: "avatarHole",
};

export function pickHeaderRefWidth(frameWidth: number): number {
  if (frameWidth <= 0) return 375;
  return frameWidth;
}

export function createDefaultOverlayTuning(): HeaderOverlayTuning {
  const o = HEADER_COMPOSITE_LAYOUT.overlay;
  return {
    offsetX: o.left * 100,
    offsetY: o.top * 100,
    scale: o.width,
    topCropPt: 0,
    bottomCropPt: 0,
  };
}

export function createDefaultSlotOffsets(): Record<SanctuaryHeaderSlotKey, OpticalOffset> {
  return {
    month: { x: 0, y: 0 },
    wonderBottle: { x: 0, y: 0 },
    wonderCount: { x: 0, y: 0 },
    childName: { x: 0, y: 0 },
    settings: { x: 0, y: 0 },
    avatar: { x: 0, y: 0 },
  };
}

export function createDefaultTuningState(): SanctuaryHeaderTuningState {
  return {
    overlay: createDefaultOverlayTuning(),
    bandHeight: HEADER_COMPOSITE_BAND_HEIGHT,
    avatarCenterY: HEADER_COMPOSITE_LAYOUT.avatarHole.center.y,
    slotOffsets: createDefaultSlotOffsets(),
  };
}

export function mergeTuningSlotOffset(
  base: OpticalOffset | undefined,
  delta: OpticalOffset,
): OpticalOffset {
  return {
    x: (base?.x ?? 0) + delta.x,
    y: (base?.y ?? 0) + delta.y,
  };
}

function slotOffsetFromLayout(key: SanctuaryHeaderSlotKey): OpticalOffset {
  return HEADER_OPTICAL_OFFSETS[SLOT_TO_OPTICAL[key]];
}

export function mergedSlotOffset(
  key: SanctuaryHeaderSlotKey,
  tuning: SanctuaryHeaderTuningState,
): OpticalOffset {
  return mergeTuningSlotOffset(slotOffsetFromLayout(key), tuning.slotOffsets[key]);
}

function formatOffset(offset: OpticalOffset): string {
  return `{ x: ${offset.x}, y: ${offset.y} }`;
}

export function formatTuningForLayoutTs(state: SanctuaryHeaderTuningState): string {
  const month = mergedSlotOffset("month", state);
  const wonderBottle = mergedSlotOffset("wonderBottle", state);
  const wonderCount = mergedSlotOffset("wonderCount", state);
  const childName = mergedSlotOffset("childName", state);
  const settings = mergedSlotOffset("settings", state);
  const avatar = mergedSlotOffset("avatar", state);

  return [
    "// Paste into src/features/sanctuary/sanctuaryHeaderLayout.ts",
    `// HEADER_COMPOSITE_LAYOUT.overlay: full-band cropped header_illustration_strip asset (fixed)`,
    `export const HEADER_COMPOSITE_BAND_HEIGHT = ${state.bandHeight};`,
    "",
    "// HEADER_OPTICAL_OFFSETS (merge base + dev slotOffsets):",
    `// month: ${formatOffset(month)},`,
    `// calendar: ${formatOffset(HEADER_OPTICAL_OFFSETS.calendar)},`,
    `// wonderBottle: ${formatOffset(wonderBottle)},`,
    `// wonderCount: ${formatOffset(wonderCount)},`,
    `// childName: ${formatOffset(childName)},`,
    `// avatarHole: ${formatOffset(avatar)},`,
    `// profileFrame: ${formatOffset(HEADER_OPTICAL_OFFSETS.profileFrame)},`,
    `// settings: ${formatOffset(settings)},`,
  ].join("\n");
}

export function parseTuningStateJson(raw: string): SanctuaryHeaderTuningState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SanctuaryHeaderTuningState>;
    if (typeof parsed.bandHeight !== "number") return null;
    const defaults = createDefaultTuningState();
    return {
      overlay: { ...defaults.overlay, ...parsed.overlay },
      bandHeight: parsed.bandHeight ?? defaults.bandHeight,
      avatarCenterY: parsed.avatarCenterY ?? defaults.avatarCenterY,
      slotOffsets: { ...defaults.slotOffsets, ...parsed.slotOffsets },
    };
  } catch {
    return null;
  }
}
