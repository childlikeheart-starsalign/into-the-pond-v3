import { useLocalSearchParams } from "expo-router";

import { DiaryEntryScreen } from "@/screens/DiaryEntryScreen";

export default function DiaryEntryRoute() {
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const lessonId = Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId;

  return <DiaryEntryScreen lessonId={lessonId ?? ""} />;
}
