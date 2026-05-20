import type { LessonItem } from "@/src/features/classroom/types";

/** Static curriculum slice until lesson_access / WatermelonDB wiring lands */
export const LESSONS_BY_MODULE: Record<number, LessonItem[]> = {
  1: [
    { id: "1.1", moduleId: "1", title: "Signal before correction" },
    { id: "1.2", moduleId: "1", title: "Connection before instruction" },
    { id: "1.3", moduleId: "1", title: "Repair and return" },
  ],
  2: [
    { id: "2.1", moduleId: "2", title: "Module 2 — Lesson A" },
    { id: "2.2", moduleId: "2", title: "Module 2 — Lesson B" },
  ],
  3: [
    { id: "3.1", moduleId: "3", title: "Module 3 — Lesson A" },
    { id: "3.2", moduleId: "3", title: "Module 3 — Lesson B" },
  ],
  4: [
    { id: "4.1", moduleId: "4", title: "Module 4 — Lesson A" },
    { id: "4.2", moduleId: "4", title: "Module 4 — Lesson B" },
  ],
  5: [
    { id: "5.1", moduleId: "5", title: "Module 5 — Lesson A" },
    { id: "5.2", moduleId: "5", title: "Module 5 — Lesson B" },
  ],
};
