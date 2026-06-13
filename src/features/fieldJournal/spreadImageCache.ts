import type { SkImage } from "@shopify/react-native-skia";

/** Retain SkImage refs for the active 3-spread window (GPU memory). */
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

export function clearSpreadImageCache(): void {
  spreadGpuCache.clear();
}
