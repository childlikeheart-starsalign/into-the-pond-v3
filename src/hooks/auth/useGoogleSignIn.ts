import { GoogleAuthProvider, signInWithCredential, type UserCredential } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import { env } from "@/src/config/env";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  getGoogleSignInModule,
  isGoogleSignInNativeAvailable,
} from "@/src/services/auth/googleSignInNative";

const GOOGLE_AUTH_ERROR_MESSAGE = "We couldn't connect with Google — try again.";
const GOOGLE_AUTH_CONFIG_ERROR_MESSAGE =
  "Google Sign-In is not configured yet — add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.";

let googleSignInConfigured = false;

function ensureGoogleSignInConfigured(): boolean {
  const googleSignIn = getGoogleSignInModule();
  if (!googleSignIn || !env.googleWebClientId) {
    return false;
  }
  if (!googleSignInConfigured) {
    googleSignIn.GoogleSignin.configure({ webClientId: env.googleWebClientId });
    googleSignInConfigured = true;
  }
  return true;
}

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "android" && isGoogleSignInNativeAvailable() && env.googleWebClientId) {
      ensureGoogleSignInConfigured();
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = useCallback(async (): Promise<UserCredential | null> => {
    setError(null);
    setLoading(true);

    try {
      const googleSignIn = getGoogleSignInModule();
      if (!googleSignIn) {
        setError(GOOGLE_AUTH_CONFIG_ERROR_MESSAGE);
        return null;
      }

      const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = googleSignIn;

      if (!ensureGoogleSignInConfigured()) {
        setError(GOOGLE_AUTH_CONFIG_ERROR_MESSAGE);
        return null;
      }

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        return null;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        setError(GOOGLE_AUTH_ERROR_MESSAGE);
        return null;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      return await signInWithCredential(firebaseAuth, credential);
    } catch (e: unknown) {
      const googleSignIn = getGoogleSignInModule();
      if (
        googleSignIn &&
        googleSignIn.isErrorWithCode(e) &&
        e.code === googleSignIn.statusCodes.SIGN_IN_CANCELLED
      ) {
        return null;
      }
      setError(GOOGLE_AUTH_ERROR_MESSAGE);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { signIn, loading, error, clearError };
}
