import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { LESSONS_BY_MODULE } from "@/src/features/classroom/lessonCatalog";
import type { LessonItem } from "@/src/features/classroom/types";
import { colors, layout, spacing } from "@/src/constants/theme";

type OpenBookProps = {
  selectedModule: number;
  selectedLessonId: string | null;
  onSelectLesson: (lesson: LessonItem) => void;
};

export function OpenBook({ selectedModule, selectedLessonId, onSelectLesson }: OpenBookProps) {
  const lessons = LESSONS_BY_MODULE[selectedModule] ?? [];

  return (
    <ScrollView
      style={openStyles.scroll}
      contentContainerStyle={openStyles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={layout.screenTitle}>Classroom</Text>
      <Text style={layout.subtitle}>
        Module {selectedModule} — open a lesson to begin commitment, video, and diary steps.
      </Text>
      <View style={{ gap: spacing.inner }}>
        {lessons.map((lesson) => {
          const active = lesson.id === selectedLessonId;
          return (
            <Pressable
              key={lesson.id}
              accessibilityRole="button"
              accessibilityLabel={`Open lesson ${lesson.title}`}
              style={[layout.card, active && { borderColor: colors.primary }]}
              onPress={() => onSelectLesson(lesson)}
            >
              <Text style={[layout.screenTitle, { fontSize: 18 }]}>{lesson.title}</Text>
              <Text style={layout.muted}>{lesson.id}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const openStyles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.section,
    paddingBottom: spacing.section,
    gap: spacing.section,
  },
});
