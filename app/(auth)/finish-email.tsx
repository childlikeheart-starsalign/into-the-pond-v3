import { router, type Href, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthFrame, CloudButton } from "@/src/components/auth/AuthArtwork";
import { colors } from "@/src/constants/theme";
import { media } from "@/src/constants/media";
import { emailVerifiedHitRects, normRectToStyle } from "@/src/constants/emailVerifiedArtboard";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { routes } from "@/src/navigation/routes";
import { applyEmailActionCode, reloadCurrentUser } from "@/src/services/firebase/auth";
import { formatFirebaseAuthError } from "@/src/services/firebase/authLinks";

function paramFirst(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

type Status = "idle" | "working" | "done" | "error";

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
  const frame = usePortrait916Layout();

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const artboardWidth = frame.width;
  const artboardHeight = frame.height;
  const enterButtonStyle = normRectToStyle(
    emailVerifiedHitRects.enterButton,
    artboardWidth,
    artboardHeight,
  );
  const layerSize = { width: artboardWidth, height: artboardHeight };

  useEffect(() => {
    if (!oobCode) {
      setStatus("error");
      setError("Invalid link.");
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
      () => setStatus("done"),
      (e: unknown) => {
        setStatus("error");
        setError(formatFirebaseAuthError(e));
      },
    );
  }, [oobCode, mode]);

  if (status === "done") {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { minHeight: windowHeight, backgroundColor: colors.bg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.artboard,
              {
                marginLeft: frame.left,
                marginTop: frame.top,
                width: artboardWidth,
                height: artboardHeight,
              },
            ]}
          >
            <Image
              source={media.auth.emailVerified.background}
              style={[styles.layerImage, layerSize]}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />

            <Pressable
              style={[styles.hitTarget, enterButtonStyle]}
              onPress={() => router.replace(routes.sanctuary)}
              accessibilityRole="button"
              accessibilityLabel="Enter"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <AuthFrame helperText="Save your pond, sync across devices, and keep your Wonders">
      {(status === "working" || status === "idle") && (
        <View style={{ alignItems: "center", gap: 16 }}>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              color: "#2E2520",
              textAlign: "center",
            }}
          >
            Confirming your email...
          </Text>
        </View>
      )}

      {status === "error" && (
        <>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 17,
              lineHeight: 26,
              color: "#B86A6A",
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <CloudButton label="Back to sign in" onPress={() => router.replace(routes.login)} />
        </>
      )}
    </AuthFrame>
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
  artboard: {
    alignSelf: "stretch",
    position: "relative",
  },
  layerImage: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  hitTarget: {
    backgroundColor: "transparent",
  },
});
