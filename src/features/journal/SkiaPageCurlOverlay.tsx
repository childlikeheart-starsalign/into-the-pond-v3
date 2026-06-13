/**
 * Journal reader: open_book_scene + clipped spread (stillwater) or open_book_scene + page crops (deep current).
 */

import {
  Canvas,
  Fill,
  Group,
  Image,
  ImageShader,
  rect,
  rrect,
  Shader,
  Skia,
  useImage,
} from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { fieldJournalMedia } from "@/src/features/fieldJournal/fieldJournalMedia";
import {
  JOURNAL_BINDING_STRIP_LEFT_NORM,
  JOURNAL_PAGE_BACK_COLOR,
  JOURNAL_PAGE_CURL_BLEED,
} from "@/src/features/fieldJournal/fieldJournalLayout";
import {
  journalBookPageContentFrameRect,
  journalPageCurlSurfaceRect,
  journalPageCropFrameRect,
  journalPageImageOffset,
  type FitRect,
} from "@/src/features/fieldJournal/fitContainRect";
import type { FieldJournalSpread } from "@/src/features/fieldJournal/types";
import { PAGE_CURL_SKSL, pageBackColorUniform } from "@/src/features/journal/pageCurlShader";

const COMMIT_RATIO = 0.3;
const VELOCITY_THRESHOLD = 600;
const MAX_DRAG_RATIO = 0.7;
const SPRING = { damping: 30, stiffness: 260, mass: 1.1 };
const COMMIT_DURATION_MS = 280;

type CurlDirection = "forward" | "backward";

type SkiaPageCurlOverlayProps = {
  width: number;
  height: number;
  sceneRect: FitRect;
  pageRect: FitRect;
  currentSpread: FieldJournalSpread;
  nextSpread: FieldJournalSpread | null;
  prevSpread: FieldJournalSpread | null;
  canGoLeft: boolean;
  canGoRight: boolean;
  disabled?: boolean;
  reduceMotion?: boolean;
  onCommitStart?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

function usesPageComposite(spread: FieldJournalSpread | null): spread is FieldJournalSpread & {
  pageAsset: number;
} {
  return spread?.pageAsset != null;
}

function OpenBookSceneLayer({
  sceneImage,
  sceneRect,
}: {
  sceneImage: NonNullable<ReturnType<typeof useImage>>;
  sceneRect: FitRect;
}) {
  return (
    <Image
      image={sceneImage}
      x={sceneRect.x}
      y={sceneRect.y}
      width={sceneRect.width}
      height={sceneRect.height}
      fit="fill"
    />
  );
}

/** Full spread aligned to scene, clipped to the left page slot (stillwater idle + underlay). */
function ClippedSpreadLayer({
  spreadImage,
  sceneRect,
  pageRect,
}: {
  spreadImage: NonNullable<ReturnType<typeof useImage>>;
  sceneRect: FitRect;
  pageRect: FitRect;
}) {
  const clip = rrect(rect(pageRect.x, pageRect.y, pageRect.width, pageRect.height), 0, 0);

  return (
    <Group clip={clip}>
      <Image
        image={spreadImage}
        x={sceneRect.x}
        y={sceneRect.y}
        width={sceneRect.width}
        height={sceneRect.height}
        fit="fill"
      />
    </Group>
  );
}

function PageCropLayer({
  pageImage,
  sceneRect,
}: {
  pageImage: NonNullable<ReturnType<typeof useImage>>;
  sceneRect: FitRect;
}) {
  const cropRect = journalPageCropFrameRect(sceneRect);
  const clip = rrect(rect(cropRect.x, cropRect.y, cropRect.width, cropRect.height), 0, 0);

  return (
    <Group clip={clip}>
      <Image
        image={pageImage}
        x={cropRect.x}
        y={cropRect.y}
        width={cropRect.width}
        height={cropRect.height}
        fit="fill"
      />
    </Group>
  );
}

export function SkiaPageCurlOverlay({
  width,
  height,
  sceneRect,
  pageRect,
  currentSpread,
  nextSpread,
  prevSpread,
  canGoLeft,
  canGoRight,
  disabled = false,
  reduceMotion = false,
  onCommitStart,
  onSwipeLeft,
  onSwipeRight,
}: SkiaPageCurlOverlayProps) {
  const effect = useMemo(() => Skia.RuntimeEffect.Make(PAGE_CURL_SKSL), []);
  const progress = useSharedValue(0);
  const curlDirection = useSharedValue(0);

  const compositeMode = usesPageComposite(currentSpread);

  const openBookImage = useImage(fieldJournalMedia.openBookScene);
  const currentSpreadImage = useImage(currentSpread.asset);
  const nextSpreadImage = useImage(nextSpread?.asset ?? null);
  const prevSpreadImage = useImage(prevSpread?.asset ?? null);
  const currentPageImage = useImage(compositeMode ? currentSpread.pageAsset : null);
  const nextPageImage = useImage(usesPageComposite(nextSpread) ? nextSpread.pageAsset : null);
  const prevPageImage = useImage(usesPageComposite(prevSpread) ? prevSpread.pageAsset : null);

  const [isCurling, setIsCurling] = useState(false);
  const [renderDirection, setRenderDirection] = useState<CurlDirection | null>(null);

  const pageContentRect = useMemo(() => journalBookPageContentFrameRect(sceneRect), [sceneRect]);
  const pageW = compositeMode ? pageContentRect.width : pageRect.width;
  const pageH = compositeMode ? pageContentRect.height : pageRect.height;
  const curlAnchorRect = compositeMode ? pageContentRect : pageRect;

  const curlBleed = useMemo(
    () => ({
      left: pageW * JOURNAL_PAGE_CURL_BLEED.left,
      right: pageW * JOURNAL_PAGE_CURL_BLEED.right,
      top: pageH * JOURNAL_PAGE_CURL_BLEED.top,
      bottom: pageH * JOURNAL_PAGE_CURL_BLEED.bottom,
    }),
    [pageH, pageW],
  );
  const bindingStripLeft = sceneRect.x + JOURNAL_BINDING_STRIP_LEFT_NORM * sceneRect.width;
  const curlSurfaceRect = useMemo(
    () => journalPageCurlSurfaceRect(curlAnchorRect, curlBleed, bindingStripLeft),
    [bindingStripLeft, curlAnchorRect, curlBleed],
  );
  const commitThreshold = pageW * COMMIT_RATIO;
  const maxDrag = pageW * MAX_DRAG_RATIO;
  const fullSceneCurlOffset = useMemo(
    () => journalPageImageOffset(sceneRect, curlSurfaceRect),
    [curlSurfaceRect, sceneRect],
  );
  const backColor = useMemo(() => pageBackColorUniform(JOURNAL_PAGE_BACK_COLOR), []);

  useEffect(() => {
    progress.value = 0;
    curlDirection.value = 0;
    setIsCurling(false);
    setRenderDirection(null);
  }, [currentSpread.id, curlDirection, progress]);

  const fromFullImage = renderDirection === "backward" ? prevSpreadImage : currentSpreadImage;
  const toFullImage = renderDirection === "backward" ? currentSpreadImage : nextSpreadImage;
  const fromPageImage = renderDirection === "backward" ? prevPageImage : currentPageImage;
  const toPageImage = renderDirection === "backward" ? currentPageImage : nextPageImage;

  const uniforms = useDerivedValue(() => ({
    progress: progress.value,
    pageSize: [pageW, pageH] as [number, number],
    pageOffset: [curlBleed.left, curlBleed.top] as [number, number],
    topFlag: 0,
    ...backColor,
  }));

  const finishCommit = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left") {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
      progress.value = 0;
      curlDirection.value = 0;
      setIsCurling(false);
      setRenderDirection(null);
    },
    [curlDirection, onSwipeLeft, onSwipeRight, progress],
  );

  const commitAndReset = useCallback(
    (direction: "left" | "right") => {
      onCommitStart?.();

      if (reduceMotion) {
        finishCommit(direction);
        return;
      }

      const target = direction === "left" ? 1 : 0;
      progress.value = withTiming(target, { duration: COMMIT_DURATION_MS }, (finished) => {
        if (finished) {
          runOnJS(finishCommit)(direction);
        }
      });
    },
    [finishCommit, onCommitStart, progress, reduceMotion],
  );

  const snapBack = useCallback(() => {
    const target = curlDirection.value === -1 ? 1 : 0;
    progress.value = withSpring(target, SPRING, (finished) => {
      if (finished) {
        curlDirection.value = 0;
        runOnJS(setIsCurling)(false);
        runOnJS(setRenderDirection)(null);
      }
    });
  }, [curlDirection, progress]);

  const beginForward = useCallback(() => {
    if (!canGoLeft || !nextSpread) return;
    curlDirection.value = 1;
    progress.value = 0;
    setRenderDirection("forward");
    setIsCurling(true);
  }, [canGoLeft, curlDirection, nextSpread, progress]);

  const beginBackward = useCallback(() => {
    if (!canGoRight || !prevSpread) return;
    curlDirection.value = -1;
    progress.value = 1;
    setRenderDirection("backward");
    setIsCurling(true);
  }, [canGoRight, curlDirection, prevSpread, progress]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .minDistance(6)
        .maxPointers(1)
        .activeOffsetX([-8, 8])
        .onStart((event) => {
          "worklet";
          if (event.translationX < 0 && canGoLeft) {
            runOnJS(beginForward)();
          } else if (event.translationX > 0 && canGoRight) {
            runOnJS(beginBackward)();
          }
        })
        .onUpdate((event) => {
          "worklet";
          if (curlDirection.value === 1 && event.translationX < 0) {
            progress.value = interpolate(
              Math.abs(event.translationX),
              [0, maxDrag],
              [0, 1],
              Extrapolation.CLAMP,
            );
          } else if (curlDirection.value === -1 && event.translationX > 0) {
            progress.value = interpolate(
              event.translationX,
              [0, maxDrag],
              [1, 0],
              Extrapolation.CLAMP,
            );
          }
        })
        .onEnd((event) => {
          "worklet";
          if (curlDirection.value === 1) {
            const isCommit =
              event.translationX < 0 &&
              (Math.abs(event.translationX) > commitThreshold ||
                event.velocityX < -VELOCITY_THRESHOLD);
            if (isCommit) {
              runOnJS(commitAndReset)("left");
            } else {
              runOnJS(snapBack)();
            }
            return;
          }

          if (curlDirection.value === -1) {
            const isCommit =
              event.translationX > 0 &&
              (event.translationX > commitThreshold || event.velocityX > VELOCITY_THRESHOLD);
            if (isCommit) {
              runOnJS(commitAndReset)("right");
            } else {
              runOnJS(snapBack)();
            }
          }
        }),
    [
      beginBackward,
      beginForward,
      canGoLeft,
      canGoRight,
      commitAndReset,
      commitThreshold,
      curlDirection,
      disabled,
      maxDrag,
      progress,
      snapBack,
    ],
  );

  const curlUsesPageComposite = compositeMode;
  const shaderFromImage = curlUsesPageComposite ? fromPageImage : fromFullImage;
  const shaderToImage = curlUsesPageComposite ? toPageImage : toFullImage;

  const shaderReady =
    isCurling &&
    effect != null &&
    shaderFromImage != null &&
    shaderToImage != null &&
    renderDirection != null;

  /** Page / spread revealed beneath the lifting page during curl. */
  const curlUnderlayFullSpread = renderDirection === "backward" ? fromFullImage : toFullImage;
  const curlUnderlayPageImage = renderDirection === "backward" ? fromPageImage : toPageImage;

  const showIdleCompositePage =
    compositeMode && currentPageImage != null && (!isCurling || !shaderReady);

  const showIdleClippedSpread =
    !compositeMode && currentSpreadImage != null && (!isCurling || !shaderReady);

  const showCurlUnderlayPageCrop = compositeMode && shaderReady && curlUnderlayPageImage != null;

  const showCurlUnderlayClippedSpread =
    !compositeMode && shaderReady && curlUnderlayFullSpread != null;

  const curlImageX = curlUsesPageComposite ? 0 : fullSceneCurlOffset.x;
  const curlImageY = curlUsesPageComposite ? 0 : fullSceneCurlOffset.y;
  const curlImageW = curlUsesPageComposite ? curlSurfaceRect.width : fullSceneCurlOffset.width;
  const curlImageH = curlUsesPageComposite ? curlSurfaceRect.height : fullSceneCurlOffset.height;

  return (
    <GestureDetector gesture={pan}>
      <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="box-only">
        <Canvas style={{ width, height }}>
          {openBookImage ? (
            <OpenBookSceneLayer sceneImage={openBookImage} sceneRect={sceneRect} />
          ) : null}

          {showCurlUnderlayPageCrop && curlUnderlayPageImage ? (
            <PageCropLayer pageImage={curlUnderlayPageImage} sceneRect={sceneRect} />
          ) : null}

          {showCurlUnderlayClippedSpread && curlUnderlayFullSpread ? (
            <ClippedSpreadLayer
              spreadImage={curlUnderlayFullSpread}
              sceneRect={sceneRect}
              pageRect={pageRect}
            />
          ) : null}

          {showIdleCompositePage && currentPageImage ? (
            <PageCropLayer pageImage={currentPageImage} sceneRect={sceneRect} />
          ) : null}

          {showIdleClippedSpread && currentSpreadImage ? (
            <ClippedSpreadLayer
              spreadImage={currentSpreadImage}
              sceneRect={sceneRect}
              pageRect={pageRect}
            />
          ) : null}

          {shaderReady ? (
            <Group
              transform={[{ translateX: curlSurfaceRect.x }, { translateY: curlSurfaceRect.y }]}
            >
              <Group clip={rect(0, 0, curlSurfaceRect.width, curlSurfaceRect.height)}>
                <Fill>
                  <Shader source={effect} uniforms={uniforms}>
                    <ImageShader
                      image={shaderFromImage}
                      x={curlImageX}
                      y={curlImageY}
                      width={curlImageW}
                      height={curlImageH}
                      fit="fill"
                    />
                    <ImageShader
                      image={shaderToImage}
                      x={curlImageX}
                      y={curlImageY}
                      width={curlImageW}
                      height={curlImageH}
                      fit="fill"
                    />
                  </Shader>
                </Fill>
              </Group>
            </Group>
          ) : null}
        </Canvas>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "transparent",
    zIndex: 2,
  },
});
