import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import { LocalCompletedLesson } from "@/src/db/models/LocalCompletedLesson";
import { LocalCreature } from "@/src/db/models/LocalCreature";
import { LocalDiaryEntry } from "@/src/db/models/LocalDiaryEntry";
import { LocalInventory } from "@/src/db/models/LocalInventory";
import { LocalLessonAccess } from "@/src/db/models/LocalLessonAccess";
import { LocalLesson } from "@/src/db/models/LocalLesson";
import { LocalNote } from "@/src/db/models/LocalNote";
import { LocalUserProfile } from "@/src/db/models/LocalUserProfile";
import { LocalWellQuestion } from "@/src/db/models/LocalWellQuestion";
import { schema } from "@/src/db/schema";

const adapter = new SQLiteAdapter({
  schema,
});

/**
 * Models can be added to modelClasses when you define WatermelonDB model files.
 */
export const database = new Database({
  adapter,
  modelClasses: [
    LocalNote,
    LocalUserProfile,
    LocalCompletedLesson,
    LocalInventory,
    LocalWellQuestion,
    LocalLesson,
    LocalDiaryEntry,
    LocalCreature,
    LocalLessonAccess,
  ],
});
