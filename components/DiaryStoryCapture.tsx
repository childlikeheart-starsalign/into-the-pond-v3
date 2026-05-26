import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type ElementRef,
} from "react";
import { InteractionManager, StyleSheet, Text, View } from "react-native";
import ViewShot, { captureRef, type ViewShotRef } from "react-native-view-shot";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { formatResponse, type ExportEntryData } from "@/utils/exportHelpers";

export type DiaryStoryCaptureHandle = {
  capture: () => Promise<string>;
};

type DiaryStoryCaptureProps = {
  entryData: ExportEntryData;
};

const STORY_WIDTH = 360;
const STORY_HEIGHT = 640;

export const DiaryStoryCapture = forwardRef<DiaryStoryCaptureHandle, DiaryStoryCaptureProps>(
  function DiaryStoryCapture({ entryData }, ref) {
    const shotRef = useRef<ViewShotRef>(null);
    const contentRef = useRef<ElementRef<typeof View>>(null);
    const layoutReadyRef = useRef<(() => void) | null>(null);
    const layoutPromiseRef = useRef<Promise<void>>(
      new Promise((resolve) => {
        layoutReadyRef.current = resolve;
      }),
    );

    useEffect(() => {
      layoutPromiseRef.current = new Promise((resolve) => {
        layoutReadyRef.current = resolve;
      });
    }, [entryData]);

    const waitForLayout = useCallback(async () => {
      await layoutPromiseRef.current;
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      await new Promise((resolve) => setTimeout(resolve, 64));
    }, []);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        await waitForLayout();

        const captureOptions = {
          format: "png" as const,
          quality: 1,
          result: "tmpfile" as const,
          width: 1080,
          height: 1920,
        };

        if (shotRef.current?.capture) {
          const uri = await shotRef.current.capture();
          if (uri) return uri;
        }

        if (contentRef.current) {
          const uri = await captureRef(contentRef, captureOptions);
          if (uri) return uri;
        }

        throw new Error("Unable to capture story image.");
      },
    }));

    return (
      <View pointerEvents="none" style={styles.offscreen} collapsable={false}>
        <ViewShot
          ref={shotRef}
          style={styles.canvas}
          options={{
            format: "png",
            quality: 1,
            result: "tmpfile",
            width: 1080,
            height: 1920,
          }}
        >
          <View
            ref={contentRef}
            style={styles.canvasInner}
            collapsable={false}
            onLayout={() => {
              layoutReadyRef.current?.();
            }}
          >
            <Text style={styles.brand}>Into the Pond</Text>
            <Text style={styles.title}>{entryData.lessonTitle}</Text>
            <Text style={styles.date}>{entryData.date}</Text>
            {entryData.prompts.map((prompt, index) => (
              <View key={`${prompt.question}-${index}`} style={styles.promptCard}>
                <Text style={styles.promptQuestion}>{prompt.question}</Text>
                <Text style={styles.promptAnswer}>{formatResponse(prompt.response)}</Text>
              </View>
            ))}
          </View>
        </ViewShot>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    top: 0,
    left: -STORY_WIDTH - 40,
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    overflow: "hidden",
    zIndex: -1,
  },
  canvas: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
  },
  canvasInner: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    backgroundColor: colors.bg,
    padding: 24,
    gap: spacing.inner,
  },
  brand: {
    color: colors.primary,
    fontFamily: fontFamilies.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 22,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  date: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  promptQuestion: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 14,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  promptAnswer: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});
