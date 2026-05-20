/** Ordered sanctuary mood / pose frames (576×1024 artboards). */
export const SANCTUARY_FRAME_IDS = [
  41, 42, 43, 44, 45, 46, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73,
  74, 75, 76,
] as const;

export type SanctuaryFrameId = (typeof SANCTUARY_FRAME_IDS)[number];

const frameRequires: Record<SanctuaryFrameId, number> = {
  41: require("@/assets/images/sanctuary/frame-41.png"),
  42: require("@/assets/images/sanctuary/frame-42.png"),
  43: require("@/assets/images/sanctuary/frame-43.png"),
  44: require("@/assets/images/sanctuary/frame-44.png"),
  45: require("@/assets/images/sanctuary/frame-45.png"),
  46: require("@/assets/images/sanctuary/frame-46.png"),
  58: require("@/assets/images/sanctuary/frame-58.png"),
  59: require("@/assets/images/sanctuary/frame-59.png"),
  60: require("@/assets/images/sanctuary/frame-60.png"),
  61: require("@/assets/images/sanctuary/frame-61.png"),
  62: require("@/assets/images/sanctuary/frame-62.png"),
  63: require("@/assets/images/sanctuary/frame-63.png"),
  64: require("@/assets/images/sanctuary/frame-64.png"),
  65: require("@/assets/images/sanctuary/frame-65.png"),
  66: require("@/assets/images/sanctuary/frame-66.png"),
  67: require("@/assets/images/sanctuary/frame-67.png"),
  68: require("@/assets/images/sanctuary/frame-68.png"),
  69: require("@/assets/images/sanctuary/frame-69.png"),
  70: require("@/assets/images/sanctuary/frame-70.png"),
  71: require("@/assets/images/sanctuary/frame-71.png"),
  72: require("@/assets/images/sanctuary/frame-72.png"),
  73: require("@/assets/images/sanctuary/frame-73.png"),
  74: require("@/assets/images/sanctuary/frame-74.png"),
  75: require("@/assets/images/sanctuary/frame-75.png"),
  76: require("@/assets/images/sanctuary/frame-76.png"),
};

export const sanctuaryFrameSources = SANCTUARY_FRAME_IDS.map((id) => frameRequires[id]);

export function getSanctuaryFrame(id: SanctuaryFrameId): number {
  return frameRequires[id];
}

/** Default calm garden pose */
export const SANCTUARY_DEFAULT_FRAME_ID: SanctuaryFrameId = 58;
