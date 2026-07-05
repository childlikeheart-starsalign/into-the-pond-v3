import { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

const RULE_COLOR = "rgba(44, 24, 16, 0.04)";
const RULE_STEP = 32;

type WellJournalRuledLinesProps = {
  height: number;
  style?: StyleProp<ViewStyle>;
};

/** Faint journal ruled lines — CSS-style, no paper image. */
export function WellJournalRuledLines({ height, style }: WellJournalRuledLinesProps) {
  const lineCount = useMemo(() => Math.ceil(height / RULE_STEP), [height]);

  return (
    <View pointerEvents="none" style={[styles.wrap, { height }, style]}>
      {Array.from({ length: lineCount }, (_, index) => (
        <View key={index} style={[styles.rule, { top: index * RULE_STEP + RULE_STEP }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  rule: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: RULE_COLOR,
  },
});
