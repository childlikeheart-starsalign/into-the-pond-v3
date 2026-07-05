import { useImage, type DataSourceParam, type SkImage } from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";

const JOURNAL_SCOPE = "journal:";

type CacheEntry = {
  image: SkImage | null;
  refCount: number;
};

const imageCache = new Map<string, CacheEntry>();

function stableSourceKey(source: DataSourceParam | null | undefined): string | null {
  if (source == null) return null;
  if (typeof source === "number") return `asset:${source}`;
  if (typeof source === "string") return `uri:${source}`;
  return `source:${String(source)}`;
}

function scopedKey(scope: string, sourceKey: string): string {
  return `${scope}${sourceKey}`;
}

/** Drop-in replacement for Skia useImage with journal-scoped ref tracking. */
export function useSharedSkiaImage(
  source: DataSourceParam | null | undefined,
  scope: string = JOURNAL_SCOPE,
): SkImage | null {
  const sourceKey = useMemo(() => stableSourceKey(source), [source]);
  const cacheKey = sourceKey ? scopedKey(scope, sourceKey) : null;
  const image = useImage(source ?? null);

  useEffect(() => {
    if (!cacheKey || !image) return;

    const existing = imageCache.get(cacheKey);
    if (existing) {
      existing.refCount += 1;
      existing.image = image;
    } else {
      imageCache.set(cacheKey, { image, refCount: 1 });
    }

    return () => {
      const entry = imageCache.get(cacheKey);
      if (!entry) return;
      entry.refCount -= 1;
      if (entry.refCount <= 0) {
        imageCache.delete(cacheKey);
      }
    };
  }, [cacheKey, image]);

  return image;
}

export function releaseSkiaImage(key: string): void {
  imageCache.delete(key);
}

export function releaseAllForScope(scope: string): void {
  for (const key of imageCache.keys()) {
    if (key.startsWith(scope)) {
      imageCache.delete(key);
    }
  }
}
