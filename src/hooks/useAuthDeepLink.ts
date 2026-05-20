import * as Linking from "expo-linking";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useEffect } from "react";

import { parseFirebaseAuthLink } from "@/src/services/firebase/authLinks";

/**
 * Opens password-reset / email-verification flows when the app cold-starts or receives a Firebase auth link.
 */
export function useAuthDeepLink() {
  useEffect(() => {
    const navigateFromUrl = (url: string | null) => {
      if (!url) return;
      const parsed = parseFirebaseAuthLink(url);
      if (!parsed?.oobCode) return;

      const mode = parsed.mode ?? "";

      if (mode === "resetPassword") {
        router.replace(
          `/reset-password?oobCode=${encodeURIComponent(parsed.oobCode)}&mode=${encodeURIComponent(mode)}` as Href,
        );
        return;
      }

      router.replace(
        `/finish-email?oobCode=${encodeURIComponent(parsed.oobCode)}&mode=${encodeURIComponent(mode)}` as Href,
      );
    };

    void Linking.getInitialURL().then(navigateFromUrl);
    const sub = Linking.addEventListener("url", ({ url }) => navigateFromUrl(url));
    return () => sub.remove();
  }, []);
}
