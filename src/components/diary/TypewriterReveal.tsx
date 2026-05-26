import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { colors, fontFamilies } from "@/src/constants/theme";

type TypewriterRevealProps = {
  text: string;
  /** Milliseconds per character */
  speed?: number;
  /** Delay before typing starts */
  delayMs?: number;
  /** Show full text immediately (e.g. reduced motion) */
  instant?: boolean;
  onComplete?: () => void;
  style?: object;
};

export function TypewriterReveal({
  text,
  speed = 28,
  delayMs = 400,
  instant = false,
  onComplete,
  style,
}: TypewriterRevealProps) {
  const [visibleCount, setVisibleCount] = useState(instant ? text.length : 0);
  const [started, setStarted] = useState(instant);

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
    setStarted(false);
    const startTimer = setTimeout(() => setStarted(true), delayMs);
    return () => clearTimeout(startTimer);
  }, [text, delayMs, instant]);

  useEffect(() => {
    if (!started || instant) return;
    if (visibleCount >= text.length) {
      onCompleteRef.current?.();
      return;
    }
    const timer = setTimeout(() => setVisibleCount((count) => count + 1), speed);
    return () => clearTimeout(timer);
  }, [started, visibleCount, text.length, speed, instant]);

  return (
    <Text style={[styles.text, style]} accessibilityLiveRegion="polite">
      {text.slice(0, visibleCount)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamilies.headingRegular,
    letterSpacing: -0.02 * 20,
    fontSize: 22,
    lineHeight: 32,
    color: colors.textPrimary,
    textAlign: "center",
  },
});
