export type LessonItem = {
  id: string;
  moduleId: string;
  title: string;
};

export type VideoPlayerPayload = {
  visible: boolean;
  url: string | null;
};
