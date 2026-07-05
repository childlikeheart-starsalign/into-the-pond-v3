import { router } from "expo-router";

import { routes } from "@/src/navigation/routes";

/** Close a full-screen scene: pop stack when possible, else return to Sanctuary tab. */
export function closeSceneScreen(_source: string): void {
  const canGoBack = router.canGoBack();

  if (canGoBack) {
    router.back();
    return;
  }
  router.replace(routes.sanctuary);
}
