import { Pressable, StyleSheet, Text, View } from "react-native";

type TutorialTipProps = {
  title: string;
  body: string;
  ctaLabel: string;
  onDismiss: () => void;
};

export function TutorialTip({ title, body, ctaLabel, onDismiss }: TutorialTipProps) {
  return (
    <View style={styles.floatingWrap} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Pressable onPress={onDismiss} style={styles.cta}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8DDD3",
    padding: 20,
    gap: 16,
    shadowColor: "#1F1A17",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: -0.02,
    color: "#1F1A17",
    fontSize: 22,
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
    color: "#FFFFFF",
    fontSize: 16,
  },
});
