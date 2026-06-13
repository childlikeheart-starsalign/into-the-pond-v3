import {
  FIELD_JOURNAL_REFERENCE_HEIGHT,
  FIELD_JOURNAL_REFERENCE_WIDTH,
  JOURNAL_BINDING_STRIP_LEFT_NORM,
  JOURNAL_BOOK_PAGE_CLIP_BLEED_PX,
  JOURNAL_BOOK_PAGE_NORM,
  JOURNAL_PAGE_CONTENT_BOTTOM_PX,
  JOURNAL_PAGE_CROP_REF,
  JOURNAL_PAGE_NORM_TOP_PX,
} from "@/src/features/fieldJournal/fieldJournalLayout";

/** Fit an image inside a frame using "contain" (no cropping). */
export type FitRect = { x: number; y: number; width: number; height: number };

/** Contain-fit the canonical 576×1024 journal spread artboard in the frame. */
export function fitJournalSpreadRect(frameWidth: number, frameHeight: number): FitRect {
  return fitContainRect(
    FIELD_JOURNAL_REFERENCE_WIDTH,
    FIELD_JOURNAL_REFERENCE_HEIGHT,
    frameWidth,
    frameHeight,
  );
}

/** Cover-fit the open-book scene artboard so the journal fills the frame. */
export function fitJournalSceneRect(frameWidth: number, frameHeight: number): FitRect {
  return fitCoverRect(
    FIELD_JOURNAL_REFERENCE_WIDTH,
    FIELD_JOURNAL_REFERENCE_HEIGHT,
    frameWidth,
    frameHeight,
  );
}

/** Binding + chapter-tab strip on the right edge of the spread artboard. */
export function journalBindingStripFrameRect(sceneRect: FitRect): FitRect {
  return {
    x: sceneRect.x + JOURNAL_BINDING_STRIP_LEFT_NORM * sceneRect.width,
    y: sceneRect.y,
    width: sceneRect.width * (1 - JOURNAL_BINDING_STRIP_LEFT_NORM),
    height: sceneRect.height,
  };
}

/** Map the book page overlay clip → frame coordinates using the fitted scene rect. */
export function journalBookPageFrameRect(sceneRect: FitRect): FitRect {
  const scale = sceneRect.width / FIELD_JOURNAL_REFERENCE_WIDTH;
  const bleed = JOURNAL_BOOK_PAGE_CLIP_BLEED_PX * scale;
  return {
    x: sceneRect.x + JOURNAL_BOOK_PAGE_NORM.left * sceneRect.width - bleed,
    y: sceneRect.y + JOURNAL_BOOK_PAGE_NORM.top * sceneRect.height - bleed,
    width: JOURNAL_BOOK_PAGE_NORM.width * sceneRect.width + bleed * 2,
    height: JOURNAL_BOOK_PAGE_NORM.height * sceneRect.height + bleed * 2,
  };
}

/** Parchment-only overlay rect — ends at wood line so open_book_scene shows below. */
export function journalBookPageContentFrameRect(sceneRect: FitRect): FitRect {
  const scale = sceneRect.width / FIELD_JOURNAL_REFERENCE_WIDTH;
  const bleed = JOURNAL_BOOK_PAGE_CLIP_BLEED_PX * scale;
  const contentHeightNorm =
    (JOURNAL_PAGE_CONTENT_BOTTOM_PX - JOURNAL_PAGE_NORM_TOP_PX) / FIELD_JOURNAL_REFERENCE_HEIGHT;

  return {
    x: sceneRect.x + JOURNAL_BOOK_PAGE_NORM.left * sceneRect.width - bleed,
    y: sceneRect.y + JOURNAL_BOOK_PAGE_NORM.top * sceneRect.height - bleed,
    width: JOURNAL_BOOK_PAGE_NORM.width * sceneRect.width + bleed * 2,
    height: contentHeightNorm * sceneRect.height + bleed * 2,
  };
}

/** Map page-only crop → frame coordinates using the fitted scene rect. */
export function journalPageCropFrameRect(sceneRect: FitRect): FitRect {
  const scale = sceneRect.width / FIELD_JOURNAL_REFERENCE_WIDTH;
  return {
    x: sceneRect.x + JOURNAL_PAGE_CROP_REF.left * scale,
    y: sceneRect.y + JOURNAL_PAGE_CROP_REF.top * scale,
    width: JOURNAL_PAGE_CROP_REF.width * scale,
    height: JOURNAL_PAGE_CROP_REF.height * scale,
  };
}

/** Position a full-scene image inside a page clip group (page-local coords). */
export function journalPageImageOffset(sceneRect: FitRect, pageRect: FitRect): FitRect {
  return {
    x: sceneRect.x - pageRect.x,
    y: sceneRect.y - pageRect.y,
    width: sceneRect.width,
    height: sceneRect.height,
  };
}

export type JournalPageCurlBleed = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Page rect expanded for curl rendering — asymmetric bleed in frame pixels. */
export function journalPageCurlSurfaceRect(
  pageRect: FitRect,
  bleed: JournalPageCurlBleed,
  maxRight?: number,
): FitRect {
  const surface = {
    x: pageRect.x - bleed.left,
    y: pageRect.y - bleed.top,
    width: pageRect.width + bleed.left + bleed.right,
    height: pageRect.height + bleed.top + bleed.bottom,
  };

  if (maxRight != null && surface.x + surface.width > maxRight) {
    return { ...surface, width: Math.max(0, maxRight - surface.x) };
  }

  return surface;
}

export function fitContainRect(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): FitRect {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return { x: 0, y: 0, width: frameWidth, height: frameHeight };
  }
  const scale = Math.min(frameWidth / imageWidth, frameHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (frameWidth - width) / 2,
    y: (frameHeight - height) / 2,
    width,
    height,
  };
}

export function fitCoverRect(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): FitRect {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return { x: 0, y: 0, width: frameWidth, height: frameHeight };
  }
  const scale = Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (frameWidth - width) / 2,
    y: (frameHeight - height) / 2,
    width,
    height,
  };
}
