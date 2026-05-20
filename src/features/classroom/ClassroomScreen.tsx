import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CommitmentModal } from "@/src/features/classroom/CommitmentModal";
import { ModuleDial } from "@/src/features/classroom/ModuleDial";
import { OpenBook } from "@/src/features/classroom/OpenBook";
import type { LessonItem, VideoPlayerPayload } from "@/src/features/classroom/types";
import { VideoPlayerModal } from "@/src/features/classroom/VideoPlayer";
import { TAB_SCREEN_BOTTOM_PADDING } from "@/src/constants/tabScreenLayout";
import { colors, layout, spacing } from "@/src/constants/theme";

/** Sample HTTPS MP4 for wiring checks — replace with curriculum CDN URLs */
const SAMPLE_VIDEO_URI =
  "https://storage.googleapis.com/exoplayer-test-media-1/mp4/android-screens-10s.mp4";

export function ClassroomScreen() {
  const [selectedModule, setSelectedModule] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [pendingLesson, setPendingLesson] = useState<LessonItem | null>(null);
  const [showCommitment, setShowCommitment] = useState(false);
  const [video, setVideo] = useState<VideoPlayerPayload>({ visible: false, url: null });
  const [showDiary, setShowDiary] = useState(false);
  const [diaryPresence, setDiaryPresence] = useState("");
  const [diaryConcept, setDiaryConcept] = useState("");
  const [diaryReflection, setDiaryReflection] = useState("");

  const onSelectLesson = (lesson: LessonItem) => {
    setSelectedLesson(lesson.id);
    setPendingLesson(lesson);
    setShowCommitment(true);
  };

  return (
    <SafeAreaView style={[layout.screen, { paddingBottom: TAB_SCREEN_BOTTOM_PADDING }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <OpenBook
            selectedModule={selectedModule}
            selectedLessonId={selectedLesson}
            onSelectLesson={onSelectLesson}
          />
        </View>

        <ModuleDial selectedModule={selectedModule} onModuleChange={setSelectedModule} />

        <CommitmentModal
          visible={showCommitment}
          lessonTitle={pendingLesson?.title}
          onDismiss={() => {
            setShowCommitment(false);
            setPendingLesson(null);
          }}
          onConfirm={() => {
            setShowCommitment(false);
            setVideo({ visible: true, url: SAMPLE_VIDEO_URI });
          }}
        />

        <VideoPlayerModal
          video={video}
          onClose={() => {
            setVideo({ visible: false, url: null });
          }}
          onContinueToDiary={() => {
            setVideo({ visible: false, url: null });
            setShowDiary(true);
          }}
        />

        <Modal visible={showDiary} animationType="slide" onRequestClose={() => setShowDiary(false)}>
          <SafeAreaView style={[layout.screen, { paddingHorizontal: spacing.inner }]}>
            <ScrollView
              contentContainerStyle={{ gap: spacing.section, paddingVertical: spacing.section }}
            >
              <Text style={layout.screenTitle}>Diary</Text>
              <Text style={layout.subtitle}>
                Placeholder fields — will connect to submitDiaryEntry.
              </Text>
              <Text style={layout.muted}>Lesson: {selectedLesson ?? "—"}</Text>
              <Text style={layout.muted}>Presence</Text>
              <TextInput
                style={layout.input}
                multiline
                value={diaryPresence}
                onChangeText={setDiaryPresence}
                placeholder="Where did you feel this in your body?"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={layout.muted}>Concept</Text>
              <TextInput
                style={layout.input}
                multiline
                value={diaryConcept}
                onChangeText={setDiaryConcept}
                placeholder="What feels true right now?"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={layout.muted}>Reflection</Text>
              <TextInput
                style={layout.input}
                multiline
                value={diaryReflection}
                onChangeText={setDiaryReflection}
                placeholder="What will you try next time?"
                placeholderTextColor={colors.textSecondary}
              />
              <Pressable style={layout.btnPrimary} onPress={() => setShowDiary(false)}>
                <Text style={layout.btnPrimaryText}>Save draft (local)</Text>
              </Pressable>
              <Pressable style={layout.btnSecondary} onPress={() => setShowDiary(false)}>
                <Text style={layout.btnSecondaryText}>Close</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
