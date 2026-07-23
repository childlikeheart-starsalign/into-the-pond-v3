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
import { migrations } from "@/src/db/migrations";
import { schema } from "@/src/db/schema";
import { Sentry } from "@/src/services/sentry/init";

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  onSetUpError: (error) => {
    console.warn("[db] setup failed, resetting local cache", error);
    Sentry.captureException(error, {
      tags: { area: "db_sync", flow: "setup" },
    });
    // Defer reset so it does not re-enter the native dispatcher during failed init.
    void Promise.resolve().then(() => {
      adapter.unsafeResetDatabase((result) => {
        if ("error" in result && result.error) {
          console.warn("[db] reset failed", result.error);
          Sentry.captureException(result.error, {
            tags: { area: "db_sync", flow: "reset" },
          });
        }
      });
    });
  },
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
