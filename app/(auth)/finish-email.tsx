import { router, type Href, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthFrame, CloudButton } from "@/src/components/auth/AuthArtwork";
import {
  AUTH_FINISH_EMAIL_BACK_TO_SIGN_IN,
  AUTH_FINISH_EMAIL_CONFIRMING,
  AUTH_FINISH_EMAIL_HELPER,
  AUTH_FINISH_EMAIL_INVALID_LINK,
  AUTH_FINISH_EMAIL_VERIFIED_SIGNED_OUT,
} from "@/src/constants/authCopy";
import { colors, fontFamilies } from "@/src/constants/theme";
import { media } from "@/src/constants/media";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { routes } from "@/src/navigation/routes";
import { applyEmailActionCode, reloadCurrentUser } from "@/src/services/firebase/auth";
import { formatFirebaseAuthError } from "@/src/services/firebase/authLinks";
import { firebaseAuth } from "@/src/services/firebase/client";

function paramFirst(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

type Status = "idle" | "working" | "done" | "error" | "verified_signed_out";

/** Single Firebase apply per (mode, oobCode) per JS session — avoids duplicate applyEmailActionCode when React Strict Mode runs effects twice in development. */
const verificationApplyPromises = new Map<string, Promise<void>>();

function memoizedVerificationApply(oobCode: string, mode: string | undefined): Promise<void> {
  const key = `${mode ?? ""}|${oobCode}`;
  const existing = verificationApplyPromises.get(key);
  if (existing) return existing;
  const p = (async () => {
    await applyEmailActionCode(oobCode);
    await reloadCurrentUser();
  })();
  verificationApplyPromises.set(key, p);
  return p;
}

export default function FinishEmailScreen() {
  const params = useLocalSearchParams<{ oobCode?: string | string[]; mode?: string | string[] }>();
  const oobCode = useMemo(() => paramFirst(params.oobCode), [params.oobCode]);
  const mode = useMemo(() => paramFirst(params.mode), [params.mode]);
  const { height: windowHeight } = useWindowDimensions();
  const frame = usePortrait916Layout("cover");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const artboardWidth = frame.width;
  const artboardHeight = frame.height;
  const layerSize = { width: artboardWidth, height: artboardHeight };

  useEffect(() => {
    if (!oobCode) {
      setStatus("error");
      setError(AUTH_FINISH_EMAIL_INVALID_LINK);
      return;
    }

    if (mode === "resetPassword") {
      router.replace(
        `/reset-password?oobCode=${encodeURIComponent(oobCode)}&mode=${encodeURIComponent(mode)}` as Href,
      );
      return;
    }

    setStatus("working");

    void memoizedVerificationApply(oobCode, mode).then(
      () => {
        if (firebaseAuth.currentUser) {
          setStatus("done");
          return;
        }
        setStatus("verified_signed_out");
      },
      (e: unknown) => {
        setStatus("error");
        setError(formatFirebaseAuthError(e));
      },
    );
  }, [oobCode, mode]);

  useEffect(() => {
    if (status === "done") {
      router.replace(routes.emailVerified);
    }
  }, [status]);

  if (status === "working" || status === "idle") {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <Image
            source={media.auth.signIn.loading}
            style={[styles.loadingImage, layerSize]}
            resizeMode="contain"
            accessibilityLabel={AUTH_FINISH_EMAIL_CONFIRMING}
          />
          <Text style={styles.loadingCopy} accessibilityLiveRegion="polite">
            {AUTH_FINISH_EMAIL_CONFIRMING}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === "verified_signed_out") {
    return (
      <AuthFrame helperText={AUTH_FINISH_EMAIL_HELPER}>
        <Text style={styles.signedOutMessage}>{AUTH_FINISH_EMAIL_VERIFIED_SIGNED_OUT}</Text>
        <CloudButton
          label={AUTH_FINISH_EMAIL_BACK_TO_SIGN_IN}
          onPress={() => router.replace(routes.login)}
        />
      </AuthFrame>
    );
  }

  if (status === "error") {
    return (
      <AuthFrame helperText={AUTH_FINISH_EMAIL_HELPER}>
        <Text style={styles.errorMessage}>{error}</Text>
        <CloudButton
          label={AUTH_FINISH_EMAIL_BACK_TO_SIGN_IN}
          onPress={() => router.replace(routes.login)}
        />
      </AuthFrame>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: windowHeight }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  loadingImage: {
    alignSelf: "center",
  },
  loadingCopy: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 18,
    lineHeight: 26,
    color: "#2E2520",
    textAlign: "center",
  },
  signedOutMessage: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 17,
    lineHeight: 26,
    color: "#2E2520",
    textAlign: "center",
  },
  errorMessage: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 17,
    lineHeight: 26,
    color: "#B86A6A",
    textAlign: "center",
  },
});
