import {
  minTapTargetRect,
  panelSlotToFrameBox,
  refBox,
  type FrameRect,
  type NormalizedBox,
} from "@/src/features/fishing/fishingModalLayout";
import { SANCTUARY_REF_SIZE } from "@/src/features/sanctuary/sanctuaryLandmarkLayout";
import type { HeaderOverlayTuning } from "@/src/features/sanctuary/sanctuaryHeaderTuning";

export type OpticalOffset = { x: number; y: number };

export type HeaderBandSlot = {
  left: number;
  top: number;
  width: number;
  height: number;
  offset?: OpticalOffset;
};

export type HeaderAvatarSlot = {
  centerX: number;
  centerY: number;
  diameterPt: number;
  offset?: OpticalOffset;
};

export type HeaderSettingsSlot = {
  /** Normalized within header band (top-left anchor). */
  left: number;
  top: number;
  widthPt: number;
  heightPt: number;
  offset?: OpticalOffset;
};

/** Center-anchored slot on the full 9:16 artboard (fractions of frame width/height). */
export type HeaderArtboardCenterSlot = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  offset?: OpticalOffset;
};

/** Top-anchored strip on the full 9:16 artboard (fractions of frame width/height). */
export type HeaderArtboardTopBandSlot = {
  left: number;
  top: number;
  width: number;
  height: number;
  offset?: OpticalOffset;
};

/**
 * Upper floral strip — top-anchored, not full artboard height.
 * `contain` maps the top of the 9:16 botanical asset into this band.
 */
export const HEADER_BOTANICAL_TOP_BAND: HeaderArtboardTopBandSlot = {
  left: 0,
  top: 0,
  width: 1,
  height: 0.14,
};

export type SanctuaryHeaderLayout = {
  headerHeight: number;
  wonderBottle: HeaderBandSlot;
  wonderCount: HeaderBandSlot;
  avatar: HeaderAvatarSlot;
  childName: HeaderBandSlot;
  settings: HeaderSettingsSlot;
};

export const SANCTUARY_HEADER_REF_SIZE = SANCTUARY_REF_SIZE;

export const SANCTUARY_HEADER_REF_WIDTHS = [375, 393, 430] as const;
export type SanctuaryHeaderRefWidth = (typeof SANCTUARY_HEADER_REF_WIDTHS)[number];

/** Composite top-overlay tuning — position, scale, and letterbox clip. */
export const HEADER_TOP_OVERLAY_OFFSET_X = -6;
export const HEADER_TOP_OVERLAY_OFFSET_Y = 26;
export const HEADER_TOP_OVERLAY_SCALE = 1.06;
export const HEADER_TOP_OVERLAY_TOP_CROP_PT = 48;
export const HEADER_TOP_OVERLAY_BOTTOM_CROP_PT = 18;
export const HEADER_COMPOSITE_BAND_HEIGHT = 130;
/** Pulls the composite band upward into the status-bar region (pt). */
export const HEADER_COMPOSITE_BAND_UP_SHIFT_PT = 65;
export const HEADER_COMPOSITE_AVATAR_CENTER_Y = 0.44;

function slot(x: number, y: number, w: number, h: number, offset?: OpticalOffset): HeaderBandSlot {
  return { left: x, top: y, width: w, height: h, offset };
}

function settingsSlot(
  x: number,
  y: number,
  w: number,
  h: number,
  offset?: OpticalOffset,
): HeaderSettingsSlot {
  return { left: x, top: y, widthPt: w, heightPt: h, offset };
}

export const SANCTUARY_HEADER_LAYOUTS: Record<SanctuaryHeaderRefWidth, SanctuaryHeaderLayout> = {
  375: {
    headerHeight: 182,
    wonderBottle: slot(0.79, 0.14, 0.08, 0.17, { x: -1, y: 0 }),
    wonderCount: slot(0.865, 0.18, 0.1, 0.12, { x: 1, y: 0 }),
    avatar: { centerX: 0.5, centerY: 0.48, diameterPt: 86, offset: { x: 0, y: 0 } },
    childName: slot(0.24, 0.78, 0.52, 0.12, { x: 0, y: 1 }),
    settings: settingsSlot(0.9, 0.12, 48, 48, { x: -1, y: 0 }),
  },
  393: {
    headerHeight: 184,
    wonderBottle: slot(0.8, 0.14, 0.08, 0.17, { x: -1, y: 0 }),
    wonderCount: slot(0.87, 0.18, 0.1, 0.12, { x: 1, y: 0 }),
    avatar: { centerX: 0.5, centerY: 0.48, diameterPt: 90, offset: { x: 0, y: 0 } },
    childName: slot(0.24, 0.78, 0.52, 0.12, { x: 0, y: 1 }),
    settings: settingsSlot(0.905, 0.12, 48, 48, { x: -1, y: 0 }),
  },
  430: {
    headerHeight: 188,
    wonderBottle: slot(0.81, 0.14, 0.08, 0.17, { x: -1, y: 0 }),
    wonderCount: slot(0.88, 0.18, 0.1, 0.12, { x: 1, y: 0 }),
    avatar: { centerX: 0.5, centerY: 0.48, diameterPt: 96, offset: { x: 0, y: 0 } },
    childName: slot(0.23, 0.79, 0.54, 0.11, { x: 0, y: 1 }),
    settings: settingsSlot(0.91, 0.12, 48, 48, { x: -1, y: 0 }),
  },
};

export function pickHeaderLayout(frameWidth: number): SanctuaryHeaderLayout {
  if (frameWidth <= 0) return SANCTUARY_HEADER_LAYOUTS[375];
  const nearest = SANCTUARY_HEADER_REF_WIDTHS.reduce((best, w) =>
    Math.abs(w - frameWidth) < Math.abs(best - frameWidth) ? w : best,
  );
  return SANCTUARY_HEADER_LAYOUTS[nearest];
}

export function resolveHeaderContentHeight(
  layout: SanctuaryHeaderLayout,
  useCompositeOverlay: boolean,
  bandHeightOverride?: number,
): number {
  if (!useCompositeOverlay) return layout.headerHeight;
  return bandHeightOverride ?? HEADER_COMPOSITE_BAND_HEIGHT;
}

export function resolveTunedContentHeight(
  layout: SanctuaryHeaderLayout,
  useCompositeOverlay: boolean,
  bandHeightOverride?: number,
): number {
  return resolveHeaderContentHeight(layout, useCompositeOverlay, bandHeightOverride);
}

/** Content band on full artboard (slots normalized within headerHeight, below safe area). */
export function headerContentBand(
  layout: SanctuaryHeaderLayout,
  frameHeight: number,
  useCompositeOverlay = false,
  bandHeightOverride?: number,
): NormalizedBox {
  const bandHeight = resolveHeaderContentHeight(layout, useCompositeOverlay, bandHeightOverride);
  return {
    left: 0,
    top: 0,
    width: 1,
    height: frameHeight > 0 ? bandHeight / frameHeight : 0.11,
  };
}

export function resolveHeaderAvatarSlot(
  layout: SanctuaryHeaderLayout,
  useCompositeOverlay: boolean,
  avatarCenterYOverride?: number,
): HeaderAvatarSlot {
  if (!useCompositeOverlay) return layout.avatar;
  return {
    ...layout.avatar,
    centerY: avatarCenterYOverride ?? HEADER_COMPOSITE_AVATAR_CENTER_Y,
  };
}

export function resolveTunedAvatarSlot(
  layout: SanctuaryHeaderLayout,
  useCompositeOverlay: boolean,
  avatarCenterYOverride?: number,
): HeaderAvatarSlot {
  return resolveHeaderAvatarSlot(layout, useCompositeOverlay, avatarCenterYOverride);
}

/** Positioned cover crop for composite header_top_overlay (scale, offset, letterbox clip). */
export function headerTopOverlayStyle(
  frameWidth: number,
  contentBandHeight: number,
  tuning?: HeaderOverlayTuning,
): { left: number; top: number; width: number; height: number } {
  const offsetX = tuning?.offsetX ?? HEADER_TOP_OVERLAY_OFFSET_X;
  const offsetY = tuning?.offsetY ?? HEADER_TOP_OVERLAY_OFFSET_Y;
  const scale = tuning?.scale ?? HEADER_TOP_OVERLAY_SCALE;
  const topCropPt = tuning?.topCropPt ?? HEADER_TOP_OVERLAY_TOP_CROP_PT;
  const bottomCropPt = tuning?.bottomCropPt ?? HEADER_TOP_OVERLAY_BOTTOM_CROP_PT;

  const baseWidth = frameWidth - offsetX;
  const baseHeight = contentBandHeight + topCropPt + bottomCropPt;
  const width = baseWidth * scale;
  const height = baseHeight * scale;
  const widthDelta = width - baseWidth;
  const heightDelta = height - baseHeight;
  return {
    left: offsetX - widthDelta / 2,
    top: -topCropPt + offsetY - heightDelta / 2,
    width,
    height,
  };
}

/** @deprecated Use headerContentBand + runtime safe-area padding on the component root. */
export function headerBandNormalized(
  layout: SanctuaryHeaderLayout,
  frameHeight: number,
  safeAreaTop: number,
): NormalizedBox {
  const bandHeightPt = layout.headerHeight + safeAreaTop;
  return {
    left: 0,
    top: 0,
    width: 1,
    height: frameHeight > 0 ? bandHeightPt / frameHeight : 0.12,
  };
}

function applyOffset(
  rect: { left: number; top: number; width: number; height: number },
  offset?: OpticalOffset,
) {
  const ox = offset?.x ?? 0;
  const oy = offset?.y ?? 0;
  return {
    left: rect.left + ox,
    top: rect.top + oy,
    width: rect.width,
    height: rect.height,
  };
}

export function headerRefBox(
  frame: FrameRect,
  band: NormalizedBox,
  slotRect: HeaderBandSlot,
  extraOffset?: OpticalOffset,
): { left: number; top: number; width: number; height: number } {
  const onArtboard = panelSlotToFrameBox(band, {
    left: slotRect.left,
    top: slotRect.top,
    width: slotRect.width,
    height: slotRect.height,
  });
  const mergedOffset = extraOffset
    ? {
        x: (slotRect.offset?.x ?? 0) + extraOffset.x,
        y: (slotRect.offset?.y ?? 0) + extraOffset.y,
      }
    : slotRect.offset;
  return applyOffset(refBox(frame, onArtboard), mergedOffset);
}

export function headerRefBoxWithExtraOffset(
  frame: FrameRect,
  band: NormalizedBox,
  slotRect: HeaderBandSlot,
  extraOffset?: OpticalOffset,
): { left: number; top: number; width: number; height: number } {
  return headerRefBox(frame, band, slotRect, extraOffset);
}

export function headerArtboardCenterBox(
  frame: FrameRect,
  slot: HeaderArtboardCenterSlot,
  extraOffset?: OpticalOffset,
): { left: number; top: number; width: number; height: number } {
  const width = frame.width * slot.width;
  const height = frame.height * slot.height;
  const mergedOffset = extraOffset
    ? {
        x: (slot.offset?.x ?? 0) + extraOffset.x,
        y: (slot.offset?.y ?? 0) + extraOffset.y,
      }
    : slot.offset;
  const ox = mergedOffset?.x ?? 0;
  const oy = mergedOffset?.y ?? 0;
  return {
    left: frame.width * slot.centerX - width / 2 + ox,
    top: frame.height * slot.centerY - height / 2 + oy,
    width,
    height,
  };
}

export function headerArtboardTopBandBox(
  frame: FrameRect,
  slot: HeaderArtboardTopBandSlot,
  extraOffset?: OpticalOffset,
): { left: number; top: number; width: number; height: number } {
  const mergedOffset = extraOffset
    ? {
        x: (slot.offset?.x ?? 0) + extraOffset.x,
        y: (slot.offset?.y ?? 0) + extraOffset.y,
      }
    : slot.offset;
  const ox = mergedOffset?.x ?? 0;
  const oy = mergedOffset?.y ?? 0;
  return {
    left: frame.width * slot.left + ox,
    top: frame.height * slot.top + oy,
    width: frame.width * slot.width,
    height: frame.height * slot.height,
  };
}

export function headerRefAvatarHole(
  frame: FrameRect,
  band: NormalizedBox,
  avatar: HeaderAvatarSlot,
  extraOffset?: OpticalOffset,
): { left: number; top: number; width: number; height: number; borderRadius: number } {
  const bandRect = refBox(frame, band);
  const cx = bandRect.left + bandRect.width * avatar.centerX;
  const cy = bandRect.top + bandRect.height * avatar.centerY;
  const d = avatar.diameterPt;
  const ox = (avatar.offset?.x ?? 0) + (extraOffset?.x ?? 0);
  const oy = (avatar.offset?.y ?? 0) + (extraOffset?.y ?? 0);
  return {
    left: cx - d / 2 + ox,
    top: cy - d / 2 + oy,
    width: d,
    height: d,
    borderRadius: d / 2,
  };
}

export function headerSettingsRect(
  frame: FrameRect,
  band: NormalizedBox,
  settings: HeaderSettingsSlot,
  extraOffset?: OpticalOffset,
) {
  const bandRect = refBox(frame, band);
  const left = bandRect.left + bandRect.width * settings.left;
  const top = bandRect.top + bandRect.height * settings.top;
  const ox = (settings.offset?.x ?? 0) + (extraOffset?.x ?? 0);
  const oy = (settings.offset?.y ?? 0) + (extraOffset?.y ?? 0);
  return minTapTargetRect(
    {
      left: left + ox,
      top: top + oy,
      width: settings.widthPt,
      height: settings.heightPt,
    },
    48,
  );
}

/** Normalized composite header layout (fractions of header band container W × H). */
export const HEADER_COMPOSITE_LAYOUT = {
  contentBandHeight: HEADER_COMPOSITE_BAND_HEIGHT,
  overlay: { left: 0, top: 0, width: 1, height: 1 },
  month: { anchor: { x: 0.085, y: 0.335 }, alignment: "left" as const },
  calendar: { frame: { x: 0.115, y: 0.435, width: 0.085, height: 0.235 } },
  wonderBottle: { frame: { x: 0.265, y: 0.44, width: 0.08, height: 0.22 } },
  wonderCount: { anchor: { x: 0.365, y: 0.5 }, alignment: "left" as const },
  avatarHole: { center: { x: 0.4889, y: 0.5054 }, diameter: 112 },
  childName: { anchor: { x: 0.5, y: 0.235 }, alignment: "center" as const, maxWidth: 160 },
  profileFrame: { frame: { x: 0.735, y: 0.43, width: 0.09, height: 0.205 } },
  settings: { center: { x: 0.945, y: 0.415 }, tapTarget: { width: 48, height: 48 } },
} as const;

/** Text container size fractions for anchor-positioned labels (no explicit frame in spec). */
export const HEADER_COMPOSITE_TEXT_FRAMES = {
  month: { width: 0.25, height: 0.18 },
  wonderCount: { width: 0.14, height: 0.16 },
  childName: { height: 0.14 },
} as const;

export type HeaderCompositeOpticalKey =
  | "month"
  | "calendar"
  | "wonderBottle"
  | "wonderCount"
  | "avatarHole"
  | "childName"
  | "profileFrame"
  | "settings";

export const HEADER_OPTICAL_OFFSETS: Record<HeaderCompositeOpticalKey, OpticalOffset> = {
  month: { x: 14, y: 35 },
  calendar: { x: 0, y: 2 },
  wonderBottle: { x: 1, y: 0 },
  wonderCount: { x: -31, y: 17 },
  childName: { x: -3, y: -12 },
  avatarHole: { x: 0, y: 0 },
  profileFrame: { x: 1, y: 0 },
  settings: { x: -2, y: 0 },
};

export type HeaderCompositeAbsoluteStyle = {
  position: "absolute";
  left: number;
  top: number;
  width: number;
  height: number;
  transform?: [{ translateX: number }, { translateY: number }];
  borderRadius?: number;
};

export type HeaderCompositeSlot = {
  width: number;
  height: number;
  borderRadius?: number;
  style: HeaderCompositeAbsoluteStyle;
};

function mergeOpticalOffset(base: OpticalOffset, extra?: OpticalOffset): OpticalOffset {
  return { x: base.x + (extra?.x ?? 0), y: base.y + (extra?.y ?? 0) };
}

export function headerNormalizedOverlayRect(
  headerWidth: number,
  headerHeight: number,
): { left: number; top: number; width: number; height: number } {
  const o = HEADER_COMPOSITE_LAYOUT.overlay;
  return {
    left: headerWidth * o.left,
    top: headerHeight * o.top,
    width: headerWidth * o.width,
    height: headerHeight * o.height,
  };
}

export function headerNormalizedFrameRect(
  headerWidth: number,
  headerHeight: number,
  frame: { x: number; y: number; width: number; height: number },
  offset?: OpticalOffset,
): { left: number; top: number; width: number; height: number } {
  const ox = offset?.x ?? 0;
  const oy = offset?.y ?? 0;
  return {
    left: headerWidth * frame.x + ox,
    top: headerHeight * frame.y + oy,
    width: headerWidth * frame.width,
    height: headerHeight * frame.height,
  };
}

export function headerAnchorSlot(
  headerWidth: number,
  headerHeight: number,
  anchor: { x: number; y: number },
  alignment: "left" | "center",
  width: number,
  height: number,
  offset?: OpticalOffset,
): HeaderCompositeSlot {
  const ox = offset?.x ?? 0;
  const oy = offset?.y ?? 0;
  const left = headerWidth * anchor.x + ox;
  const top = headerHeight * anchor.y + oy;
  const transform: [{ translateX: number }, { translateY: number }] =
    alignment === "center"
      ? [{ translateX: -width / 2 }, { translateY: -height / 2 }]
      : [{ translateX: 0 }, { translateY: -height / 2 }];
  return {
    width,
    height,
    style: {
      position: "absolute",
      left,
      top,
      width,
      height,
      transform,
    },
  };
}

export function headerCenterSlot(
  headerWidth: number,
  headerHeight: number,
  center: { x: number; y: number },
  width: number,
  height: number,
  offset?: OpticalOffset,
  borderRadius?: number,
): HeaderCompositeSlot {
  const ox = offset?.x ?? 0;
  const oy = offset?.y ?? 0;
  return {
    width,
    height,
    borderRadius,
    style: {
      position: "absolute",
      left: headerWidth * center.x + ox,
      top: headerHeight * center.y + oy,
      width,
      height,
      borderRadius,
      transform: [{ translateX: -width / 2 }, { translateY: -height / 2 }],
    },
  };
}

export type SanctuaryHeaderCompositeLayout = {
  overlay: { left: number; top: number; width: number; height: number };
  month: HeaderCompositeSlot;
  calendar: HeaderCompositeSlot;
  wonderBottle: HeaderCompositeSlot;
  wonderCount: HeaderCompositeSlot;
  avatarHole: HeaderCompositeSlot;
  childName: HeaderCompositeSlot;
  profileFrame: HeaderCompositeSlot;
  settingsDecor: HeaderCompositeSlot;
  settingsHit: HeaderCompositeSlot;
};

export type HeaderCompositeTuningOffsets = Partial<
  Record<HeaderCompositeOpticalKey, OpticalOffset>
>;

export function buildSanctuaryHeaderCompositeLayout(
  headerWidth: number,
  headerHeight: number,
  tuningOffsets?: HeaderCompositeTuningOffsets,
): SanctuaryHeaderCompositeLayout {
  const optical = (key: HeaderCompositeOpticalKey) =>
    mergeOpticalOffset(HEADER_OPTICAL_OFFSETS[key], tuningOffsets?.[key]);

  const layout = HEADER_COMPOSITE_LAYOUT;
  const textFrames = HEADER_COMPOSITE_TEXT_FRAMES;

  const monthWidth = headerWidth * textFrames.month.width;
  const monthHeight = headerHeight * textFrames.month.height;
  const wonderWidth = headerWidth * textFrames.wonderCount.width;
  const wonderHeight = headerHeight * textFrames.wonderCount.height;
  const childNameWidth = Math.min(layout.childName.maxWidth, headerWidth * 0.52);
  const childNameHeight = headerHeight * textFrames.childName.height;

  const calendarRect = headerNormalizedFrameRect(
    headerWidth,
    headerHeight,
    layout.calendar.frame,
    optical("calendar"),
  );
  const wonderBottleRect = headerNormalizedFrameRect(
    headerWidth,
    headerHeight,
    layout.wonderBottle.frame,
    optical("wonderBottle"),
  );
  const profileRect = headerNormalizedFrameRect(
    headerWidth,
    headerHeight,
    layout.profileFrame.frame,
    optical("profileFrame"),
  );

  const settingsOffset = optical("settings");
  const settingsW = layout.settings.tapTarget.width;
  const settingsH = layout.settings.tapTarget.height;
  const settingsCx = headerWidth * layout.settings.center.x + settingsOffset.x;
  const settingsCy = headerHeight * layout.settings.center.y + settingsOffset.y;
  const settingsHitRect = minTapTargetRect(
    {
      left: settingsCx - settingsW / 2,
      top: settingsCy - settingsH / 2,
      width: settingsW,
      height: settingsH,
    },
    48,
  );

  const settingsCenter = headerCenterSlot(
    headerWidth,
    headerHeight,
    layout.settings.center,
    settingsW,
    settingsH,
    settingsOffset,
  );

  return {
    overlay: headerNormalizedOverlayRect(headerWidth, headerHeight),
    month: headerAnchorSlot(
      headerWidth,
      headerHeight,
      layout.month.anchor,
      layout.month.alignment,
      monthWidth,
      monthHeight,
      optical("month"),
    ),
    calendar: frameRectToSlot(calendarRect),
    wonderBottle: frameRectToSlot(wonderBottleRect),
    wonderCount: headerAnchorSlot(
      headerWidth,
      headerHeight,
      layout.wonderCount.anchor,
      layout.wonderCount.alignment,
      wonderWidth,
      wonderHeight,
      optical("wonderCount"),
    ),
    avatarHole: headerCenterSlot(
      headerWidth,
      headerHeight,
      layout.avatarHole.center,
      layout.avatarHole.diameter,
      layout.avatarHole.diameter,
      optical("avatarHole"),
      layout.avatarHole.diameter / 2,
    ),
    childName: headerAnchorSlot(
      headerWidth,
      headerHeight,
      layout.childName.anchor,
      layout.childName.alignment,
      childNameWidth,
      childNameHeight,
      optical("childName"),
    ),
    profileFrame: frameRectToSlot(profileRect),
    settingsDecor: settingsCenter,
    settingsHit: frameRectToSlot(settingsHitRect),
  };
}

function frameRectToSlot(rect: {
  left: number;
  top: number;
  width: number;
  height: number;
}): HeaderCompositeSlot {
  return {
    width: rect.width,
    height: rect.height,
    style: {
      position: "absolute",
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    },
  };
}
