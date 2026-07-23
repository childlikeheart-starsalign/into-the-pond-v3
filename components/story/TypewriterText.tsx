import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";

import { storyFolioColors } from "@/src/constants/storyDialogueStyles";
import { fontFamilies } from "@/src/constants/theme";

type TypewriterTextProps = {
  text: string;
  /** Milliseconds per character */
  speed?: number;
  /** Delay before the first character appears */
  delayMs?: number;
  instant?: boolean;
  onComplete?: () => void;
  style?: StyleProp<TextStyle>;
};

export function TypewriterText({
  text,
  speed = 28,
  delayMs = 0,
  instant = false,
  onComplete,
  style,
}: TypewriterTextProps) {
  const [visibleCount, setVisibleCount] = useState(instant ? text.length : 0);
  const [started, setStarted] = useState(instant || delayMs === 0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (instant) {
      setVisibleCount(text.length);
      setStarted(true);
      onCompleteRef.current?.();
      return;
    }

    setVisibleCount(0);
    setStarted(delayMs === 0);
    if (delayMs === 0) return;

    const startTimer = setTimeout(() => setStarted(true), delayMs);
    return () => clearTimeout(startTimer);
  }, [text, delayMs, instant]);

  useEffect(() => {
    if (!started || instant) return;
    if (visibleCount >= text.length) {
      if (visibleCount >= text.length) onCompleteRef.current?.();
      return;
    }

    const timer = setTimeout(() => setVisibleCount((count) => count + 1), speed);
    return () => clearTimeout(timer);
  }, [started, instant, visibleCount, text.length, speed]);

  return (
    <Text style={[styles.text, style]} accessibilityLiveRegion="polite">
      {text.slice(0, visibleCount)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "400",
    letterSpacing: -0.01 * 16,
    color: storyFolioColors.ink,
    textAlign: "left",
    width: "100%",
  },
});
