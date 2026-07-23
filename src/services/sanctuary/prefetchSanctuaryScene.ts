import { Image, type ImageSourcePropType } from "react-native";

import {
  CRITICAL_PREFETCH_LAYERS,
  getSanctuaryPrefetchManifest,
  type SanctuaryPrefetchLayer,
} from "@/src/services/sanctuary/prefetchSanctuaryScene.manifest";

export {
  CRITICAL_PREFETCH_LAYERS,
  getSanctuaryPrefetchManifest,
  type SanctuaryPrefetchLayer,
  type SanctuaryPrefetchManifest,
} from "@/src/services/sanctuary/prefetchSanctuaryScene.manifest";

function resolvePrefetchUri(source: ImageSourcePropType): string | null {
  if (typeof Image.resolveAssetSource !== "function") {
    return null;
  }
  const resolved = Image.resolveAssetSource(source);
  return resolved?.uri ?? null;
}

async function prefetchSource(source: ImageSourcePropType): Promise<boolean> {
  const uri = resolvePrefetchUri(source);
  if (!uri) {
    return true;
  }
  try {
    return await Image.prefetch(uri);
  } catch {
    return false;
  }
}

export type PrefetchSanctuarySceneResult = {
  criticalReady: boolean;
  layerResults: Record<SanctuaryPrefetchLayer, boolean>;
};

/** Parallel prefetch for afternoon sanctuary tableau layers. */
export async function prefetchSanctuaryScene(): Promise<PrefetchSanctuarySceneResult> {
  const manifest = getSanctuaryPrefetchManifest();

  const [background, mood, avatar, tabStrip, header, ...navIconResults] = await Promise.all([
    prefetchSource(manifest.background),
    prefetchSource(manifest.mood),
    prefetchSource(manifest.avatar),
    prefetchSource(manifest.tabStrip),
    Promise.all(manifest.headerSources.map((source) => prefetchSource(source))).then((results) =>
      results.every(Boolean),
    ),
    ...manifest.navIcons.map((icon) => prefetchSource(icon)),
  ]);

  const navIconsOk = navIconResults.every(Boolean);
  const layerResults: Record<SanctuaryPrefetchLayer, boolean> = {
    background,
    mood,
    avatar,
    tabStrip,
    header,
    navIcons: navIconsOk,
  };

  const criticalReady = CRITICAL_PREFETCH_LAYERS.every((layer) => layerResults[layer]);

  if (!criticalReady) {
    console.warn("[CurtainLift] sanctuary prefetch incomplete", layerResults);
  }

  return { criticalReady, layerResults };
}
