import { Pressable, StyleSheet, Text, View } from "react-native";

type OpeningSequenceProps = {
  onContinue: () => void;
};

export function OpeningSequence({ onContinue }: OpeningSequenceProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Before we begin</Text>
        <Text style={styles.body}>
          This 7-day guide gives one small step at a time. Start with gentle momentum and build
          consistency day by day.
        </Text>
        <Pressable onPress={onContinue} style={styles.cta}>
          <Text style={styles.ctaText}>Start day 1</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31,26,23,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8DDD3",
    padding: 20,
    gap: 16,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: -0.02,
    color: "#1F1A17",
    fontSize: 24,
  },
  body: {
    fontFamily: "Inter_400Regular",
    color: "#5B514A",
    fontSize: 16,
    lineHeight: 24,
  },
  cta: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7A5C45",
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
