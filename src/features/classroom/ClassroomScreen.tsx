import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ImageBackground, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import {
  CLASSROOM_MODULE_COUNT,
  CLASSROOM_MENU_SCENE_TOP_SHIFT,
  classroomAssets,
  classroomHitRects,
  classroomOpenCroppedImageStyle,
  classroomOpenRectInCrop,
  getClassroomChapterFrame,
  getClassroomMenuFrame,
  type ClassroomView,
} from "@/src/constants/classroomAssets";
import { colors, fontFamilies, handwrittenPrompt } from "@/src/constants/theme";
import { getLessonForChapterRow } from "@/src/features/classroom/lessonCatalog";
import { PaywallModal } from "@/src/features/classroom/PaywallModal";
import { useLessonNavigation } from "@/src/features/classroom/useLessonNavigation";
import { VideoPlayerModal } from "@/src/features/classroom/VideoPlayer";
import { WellTopBar } from "@/src/features/well/WellTopBar";
import { useSanctuaryTimeOfDay } from "@/src/hooks/useSanctuaryTimeOfDay";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { closeSceneScreen } from "@/src/navigation/closeSceneScreen";
import { setClassroomView } from "@/src/state/classroomView";

const SWIPE_THRESHOLD_PX = 36;
function percentRectStyle(rect: { left: number; top: number; width: number; height: number }) {
  return {
    left: `${rect.left * 100}%`,
    top: `${rect.top * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`,
  } as const;
}

export function ClassroomScreen() {
  const timeOfDay = useSanctuaryTimeOfDay();
  const insets = useSafeAreaInsets();
  const frame = usePortrait916Layout("contain");
  const menuSceneShift = frame.height > 0 ? frame.height * CLASSROOM_MENU_SCENE_TOP_SHIFT : 0;
  const { handleLessonPress, paywallVisible, closePaywall, video, closeVideo } =
    useLessonNavigation();
  const [view, setView] = useState<ClassroomView>("open");
  const [selectedModule, setSelectedModule] = useState(1);

  useEffect(() => {
    setClassroomView(view);
    return () => {
      setClassroomView("open");
    };
  }, [view]);

  const backgroundSource = useMemo(() => {
    if (view === "open") return classroomAssets.open;
    if (view === "chapters") return getClassroomChapterFrame(selectedModule);
    return getClassroomMenuFrame(timeOfDay, selectedModule);
  }, [selectedModule, timeOfDay, view]);

  const openMenu = useCallback(() => {
    setView("menu");
    setSelectedModule(1);
  }, []);

  const handleClose = useCallback(() => {
    closeSceneScreen("classroom");
  }, []);

  const closeChapters = useCallback(() => {
    setView("menu");
  }, []);

  const openLessonRow = useCallback(
    (lessonIndex: number) => {
      const lesson = getLessonForChapterRow(selectedModule, lessonIndex);
      if (lesson) {
        handleLessonPress(lesson);
      }
    },
    [handleLessonPress, selectedModule],
  );

  const lessonModals = (
    <>
      <PaywallModal visible={paywallVisible} onClose={closePaywall} />
      <VideoPlayerModal
        video={video}
        onClose={closeVideo}
        onContinueToReflection={(lessonId) => {
          router.push({ pathname: "/diary-entry", params: { lessonId } });
        }}
      />
    </>
  );

  const changeModule = useCallback((delta: number) => {
    setSelectedModule((prev) => {
      const next = prev + delta;
      return Math.max(1, Math.min(CLASSROOM_MODULE_COUNT, next));
    });
  }, []);

  const openCommissionGate = useCallback(() => {
    setView("chapters");
  }, []);

  const menuPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-20, 20])
        .onEnd((event) => {
          if (event.translationX <= -SWIPE_THRESHOLD_PX || event.velocityX < -300) {
            runOnJS(changeModule)(1);
          } else if (event.translationX >= SWIPE_THRESHOLD_PX || event.velocityX > 300) {
            runOnJS(changeModule)(-1);
          }
        }),
    [changeModule],
  );

  let screenContent: ReactNode;

  if (view === "open") {
    const openTapRect = classroomOpenRectInCrop(classroomHitRects.openTap);

    screenContent = (
      <Portrait916Frame mode="contain" backgroundColor={colors.bg}>
        <View style={styles.openScene} accessibilityLabel="Classroom open">
          <Image
            source={classroomAssets.open}
            style={[styles.openSceneImage, classroomOpenCroppedImageStyle()]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.topBarWrap} pointerEvents="box-none">
              <WellTopBar onClose={handleClose} closeAccessibilityLabel="Close Classroom" />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tap to open classroom menu"
              style={[styles.openTapTarget, percentRectStyle(openTapRect)]}
              onPress={openMenu}
            >
              <Text style={styles.tapToOpenLabel}>Tap to open</Text>
            </Pressable>
          </View>
        </View>
      </Portrait916Frame>
    );
  } else if (view === "chapters") {
    screenContent = (
      <Portrait916Frame mode="contain" backgroundColor="transparent">
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          resizeMode="cover"
          accessibilityLabel={`Module ${selectedModule} lessons`}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel and return to module menu"
            onPress={closeChapters}
            style={[styles.chapterCancelButton, { top: Math.max(10, insets.top + 2) }]}
          >
            <Text style={styles.cancelText}>×</Text>
          </Pressable>

          {classroomHitRects.chapterLessonRows.map((rect, index) => {
            const lesson = getLessonForChapterRow(selectedModule, index);
            return (
              <Pressable
                key={`lesson-${index}`}
                accessibilityRole="button"
                accessibilityLabel={
                  lesson
                    ? `Open lesson ${lesson.title}`
                    : `Open lesson ${selectedModule}.${index + 1}`
                }
                style={[styles.hitTarget, percentRectStyle(rect)]}
                onPress={() => openLessonRow(index)}
              />
            );
          })}
        </ImageBackground>
      </Portrait916Frame>
    );
  } else {
    screenContent = (
      <Portrait916Frame mode="contain" backgroundColor={colors.bg}>
        <View style={styles.menuFrameRoot}>
          <View style={styles.topBarWrap} pointerEvents="box-none">
            <WellTopBar onClose={handleClose} closeAccessibilityLabel="Close Classroom" />
          </View>

          <View
            style={[
              styles.menuSceneShift,
              {
                top: -menuSceneShift,
                bottom: -menuSceneShift,
              },
            ]}
          >
            <ImageBackground
              source={backgroundSource}
              style={styles.background}
              resizeMode="cover"
              accessibilityLabel={`Classroom module ${selectedModule}`}
            >
              <GestureDetector gesture={menuPanGesture}>
                <View style={styles.menuOverlay} collapsable={false}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open commission gate"
                    style={[
                      styles.hitTarget,
                      styles.bookTarget,
                      percentRectStyle(classroomHitRects.menuBook),
                    ]}
                    onPress={openCommissionGate}
                  />

                  <View
                    style={[styles.hitTarget, percentRectStyle(classroomHitRects.moduleDial)]}
                  />
                </View>
              </GestureDetector>
            </ImageBackground>
          </View>
        </View>
      </Portrait916Frame>
    );
  }

  return (
    <>
      <View style={styles.screenRoot}>{screenContent}</View>
      {lessonModals}
    </>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  openScene: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  openSceneImage: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  background: {
    flex: 1,
  },
  menuFrameRoot: {
    flex: 1,
    overflow: "hidden",
  },
  menuSceneShift: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBarWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  hitTarget: {
    position: "absolute",
    backgroundColor: "transparent",
    minWidth: 48,
    minHeight: 48,
  },
  openTapTarget: {
    position: "absolute",
    backgroundColor: "transparent",
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  tapToOpenLabel: {
    ...handwrittenPrompt,
    color: colors.primary,
    textAlign: "center",
  },
  bookTarget: {
    zIndex: 2,
  },
  chapterCancelButton: {
    position: "absolute",
    left: 10,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(122,92,69,0.45)",
    backgroundColor: "rgba(239,228,218,0.72)",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontFamily: fontFamilies.body,
    fontSize: 24,
    lineHeight: 26,
    color: "#7A5C45",
  },
});
