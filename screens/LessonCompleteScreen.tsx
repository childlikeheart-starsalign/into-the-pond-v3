import { Ionicons } from "@expo/vector-icons";
import { CommonActions, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { routes } from "@/src/navigation/routes";

const AUTO_DISMISS_MS = 1500;

type LessonCompleteScreenProps = {
  lessonTitle?: string;
};

function resolveLessonTitle(
  propTitle: string | undefined,
  paramTitle: string | string[] | undefined,
): string {
  if (propTitle?.trim()) return propTitle.trim();
  const raw = Array.isArray(paramTitle) ? paramTitle[0] : paramTitle;
  return raw?.trim() || "Lesson";
}

/** Reset the root stack so back from classroom exits the feature (no diary/video/export). */
export function resetToClassroomList(
  navigation: NavigationProp<ParamListBase>,
  router: ReturnType<typeof useRouter>,
) {
  const root = navigation.getParent() ?? navigation;

  try {
    root.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "(tabs)",
            state: {
              index: 0,
              routes: [{ name: "classroom" }],
            },
          },
        ],
      }),
    );
  } catch (error) {
    console.warn("[LessonComplete] navigation reset fallback", error);
    router.replace(routes.classroom);
  }
}

export function LessonCompleteScreen({ lessonTitle: lessonTitleProp }: LessonCompleteScreenProps) {
  const params = useLocalSearchParams<{ lessonTitle?: string }>();
  const lessonTitle = resolveLessonTitle(lessonTitleProp, params.lessonTitle);

  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const badgeScale = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDismissed = useRef(false);

  const dismiss = useCallback(() => {
    if (hasDismissed.current) return;
    hasDismissed.current = true;

    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    resetToClassroomList(navigation, router);
  }, [navigation, router]);

  useEffect(() => {
    Animated.spring(badgeScale, {
      toValue: 1,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();

    dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    };
  }, [badgeScale, dismiss]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Lesson complete. Tap to continue to classroom."
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      onPress={dismiss}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [{ scale: badgeScale }],
            },
          ]}
        >
          <Ionicons name="checkmark" size={44} color="#FFFFFF" accessibilityLabel="Complete" />
        </Animated.View>

        <Text style={styles.celebration}>✨ Lesson complete ✨</Text>
        <Text style={styles.title}>{lessonTitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.inner,
    gap: spacing.section,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  celebration: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: "center",
  },
  title: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 22,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
    textAlign: "center",
    maxWidth: 320,
  },
});
