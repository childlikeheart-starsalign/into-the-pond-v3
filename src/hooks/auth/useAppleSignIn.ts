import * as AppleAuthentication from "expo-apple-authentication";
import { OAuthProvider, signInWithCredential, type UserCredential } from "firebase/auth";
import { useCallback, useState } from "react";

import { firebaseAuth } from "@/src/services/firebase/client";

const APPLE_AUTH_ERROR_MESSAGE = "We couldn't connect with Apple — try again.";

function createRawNonce(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function sha256Hex(value: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(value),
    );
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  const Crypto = await import("expo-crypto");
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

export function useAppleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = useCallback(async (): Promise<UserCredential | null> => {
    setError(null);
    setLoading(true);

    try {
      const rawNonce = createRawNonce();
      const hashedNonce = await sha256Hex(rawNonce);

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCredential.identityToken) {
        setError(APPLE_AUTH_ERROR_MESSAGE);
        return null;
      }

      const provider = new OAuthProvider("apple.com");
      const firebaseCred = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce,
      });

      return await signInWithCredential(firebaseAuth, firebaseCred);
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
      if (code !== "ERR_REQUEST_CANCELED") {
        setError(APPLE_AUTH_ERROR_MESSAGE);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { signIn, loading, error, clearError };
}
