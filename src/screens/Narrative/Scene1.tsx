import { Image, ImageSourcePropType, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useScene1Logic } from "./useScene1Logic";
import { styles } from "./Scene1.styles";

type Scene1Props = {
  onComplete: () => void;
  onSkip?: () => void;
  backgroundImage?: ImageSourcePropType;
};

/** Narrative scene sequence — renders 3 story cards with progress dots. */
export function Scene1({ onComplete, onSkip, backgroundImage }: Scene1Props) {
  const { currentScene, currentIndex, totalScenes, isLastScene, advance, skip } =
    useScene1Logic({ onComplete, onSkip });

  const resolvedBackground = backgroundImage ?? currentScene.backgroundImage ?? undefined;

  const content = (
    <View style={styles.overlay}>
      <View style={styles.progressRow}>
        {Array.from({ length: totalScenes }).map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{currentScene.title}</Text>
        <Text style={styles.body}>{currentScene.body}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={currentScene.ctaLabel}
          style={styles.cta}
          onPress={advance}
        >
          <Text style={styles.ctaText}>{currentScene.ctaLabel}</Text>
        </Pressable>

        {!isLastScene && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            style={styles.skipBtn}
            onPress={skip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (resolvedBackground) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Image source={resolvedBackground} style={styles.backgroundImage} resizeMode="cover">
          {content}
        </Image>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {content}
    </SafeAreaView>
  );
}
