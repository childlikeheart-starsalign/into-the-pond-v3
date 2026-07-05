import { CRITICAL_PREFETCH_LAYERS, SANCTUARY_SCENE_LAYERS } from "@/src/constants/curtainLift";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

export function runPrefetchSanctuarySceneSelfTest(): void {
  expectEqual(SANCTUARY_SCENE_LAYERS.length, 4, "scene layer count");
  expectEqual(CRITICAL_PREFETCH_LAYERS.length, 4, "critical prefetch layer count");
  expectEqual(
    CRITICAL_PREFETCH_LAYERS.join(","),
    SANCTUARY_SCENE_LAYERS.join(","),
    "critical prefetch matches scene layers",
  );
  expectEqual(CRITICAL_PREFETCH_LAYERS.includes("background"), true, "background is critical");
}
