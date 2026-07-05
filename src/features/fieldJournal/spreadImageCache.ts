import type { SkImage } from "@shopify/react-native-skia";

/** @deprecated Legacy write-only cache for FieldJournalSpreadView. Prefer releaseAllForScope('journal:'). */
const spreadGpuCache = new Map<string, SkImage>();

export function retainSpreadImage(spreadId: string, image: SkImage | null): void {
  if (!image) return;
  spreadGpuCache.set(spreadId, image);
}

export function evictSpreadImagesExcept(keepIds: Set<string>): void {
  for (const id of spreadGpuCache.keys()) {
    if (!keepIds.has(id)) {
      spreadGpuCache.delete(id);
    }
  }
}

/** @deprecated No-op when cache empty; kept for back-to-Sanctuary until SpreadView path is removed. */
export function clearSpreadImageCache(): void {
  spreadGpuCache.clear();
}
