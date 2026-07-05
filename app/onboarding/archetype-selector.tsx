import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ChildArchetype } from "@/src/constants/narrative/types";
import { useNarrativeOnboarding } from "@/src/hooks/useNarrativeOnboarding";

const OPTIONS: { value: ChildArchetype; emoji: string; label: string; subtitle: string }[] = [
  {
    value: "storm",
    emoji: "🌊",
    label: "Big feelings, hard to calm",
    subtitle: "They feel everything deeply.",
  },
  {
    value: "wall",
    emoji: "🌿",
    label: "Quiet, hard to reach",
    subtitle: "They go inward when it's loud.",
  },
  {
    value: "spark",
    emoji: "⚡",
    label: "Resistant, pushes back",
    subtitle: "They have a strong will.",
  },
];

export default function ArchetypeSelectorRoute() {
  const { selectArchetype } = useNarrativeOnboarding();
  const [loading, setLoading] = useState(false);

  const handleSelect = async (archetype: ChildArchetype) => {
    if (loading) return;
    setLoading(true);
    try {
      await selectArchetype(archetype);
    } catch (err) {
      console.error("[ArchetypeSelector] Failed to save archetype:", err);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Which feels most like your child right now?</Text>
        <Text style={styles.subheading}>You can update this anytime in settings.</Text>

        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={styles.card}
            onPress={() => handleSelect(opt.value)}
            activeOpacity={0.75}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
          >
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.label}>{opt.label}</Text>
              <Text style={styles.subtitle}>{opt.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {loading && <ActivityIndicator size="small" color="#E8A830" style={{ marginTop: 24 }} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1A1208",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
    paddingBottom: 32,
  },
  heading: {
    color: "#F5F0E8",
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 10,
  },
  subheading: {
    color: "#A8A0A0",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minHeight: 52,
  },
  emoji: {
    fontSize: 32,
    width: 44,
    textAlign: "center",
  },
  cardBody: {
    flex: 1,
  },
  label: {
    color: "#F5F0E8",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 22,
  },
  subtitle: {
    color: "#A8A0A0",
    fontSize: 13,
    lineHeight: 18,
  },
});
