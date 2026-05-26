export type LessonItem = {
  id: string;
  moduleId: string;
  title: string;
  isPremium: boolean;
  videoUrl: string | null;
};

export type VideoPlayerPayload = {
  visible: boolean;
  lesson: LessonItem | null;
};
