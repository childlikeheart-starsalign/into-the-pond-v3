import { Q } from "@nozbe/watermelondb";

import { database } from "@/src/db";
import { LocalDiaryEntry } from "@/src/db/models/LocalDiaryEntry";
import { rebuildLessonAccessCache } from "@/src/db/sync";
import { submitDiaryEntry } from "@/src/services/firebase/serverActions";

type OfflineDiaryPayload = {
  lessonId?: string;
  source: "lesson" | "reignite";
  prompts: string[];
  answers: string[];
  status: "draft" | "completed";
  wonderAwarded?: number;
  plantStage?: 0 | 1 | 2 | 3 | 4;
};

function isLikelyNetworkError(error: unknown) {
  const text = String(error ?? "").toLowerCase();
  return (
    text.includes("network") ||
    text.includes("unavailable") ||
    text.includes("offline") ||
    text.includes("timeout")
  );
}

export async function queueDiaryEntryOffline(uid: string, payload: OfflineDiaryPayload) {
  const entryId = `pending_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  await database.write(async () => {
    const table = database.get<LocalDiaryEntry>("local_diary_entries");
    await table.create((entry) => {
      entry.entryId = entryId;
      entry.uid = uid;
      entry.lessonId = payload.lessonId ?? null;
      entry.source = payload.source;
      entry.promptsJson = JSON.stringify(payload.prompts ?? []);
      entry.answersJson = JSON.stringify(payload.answers ?? []);
      entry.status = payload.status;
      entry.wonderAwarded = payload.wonderAwarded ?? 0;
      entry.plantStage = payload.plantStage ?? 0;
      entry.queueStatus = "pending";
      entry.createdAt = new Date();
    });
  });
  await rebuildLessonAccessCache(uid);
  return entryId;
}

export async function submitDiaryEntryWithOfflineFallback(uid: string, payload: OfflineDiaryPayload) {
  try {
    const result = await submitDiaryEntry(uid, payload);
    return { mode: "online" as const, result };
  } catch (error) {
    if (!isLikelyNetworkError(error)) {
      throw error;
    }
    const queuedEntryId = await queueDiaryEntryOffline(uid, payload);
    return { mode: "queued" as const, queuedEntryId };
  }
}

export async function retryPendingDiaryEntries(uid: string) {
  const table = database.get<LocalDiaryEntry>("local_diary_entries");
  const pendingEntries = await table.query(Q.where("uid", uid), Q.where("sync_status", "pending")).fetch();
  const summary = { synced: 0, failed: 0 };

  for (const entry of pendingEntries) {
    try {
      const payload: OfflineDiaryPayload = {
        lessonId: entry.lessonId ?? undefined,
        source: entry.source,
        prompts: JSON.parse(entry.promptsJson || "[]"),
        answers: JSON.parse(entry.answersJson || "[]"),
        status: entry.status,
        wonderAwarded: entry.wonderAwarded,
        plantStage: (entry.plantStage as 0 | 1 | 2 | 3 | 4) ?? 0,
      };
      await submitDiaryEntry(uid, payload);
      await database.write(async () => {
        await entry.update((row) => {
          row.queueStatus = "synced";
        });
      });
      await rebuildLessonAccessCache(uid);
      summary.synced += 1;
    } catch (error) {
      await database.write(async () => {
        await entry.update((row) => {
          row.queueStatus = isLikelyNetworkError(error) ? "pending" : "failed";
        });
      });
      await rebuildLessonAccessCache(uid);
      summary.failed += 1;
    }
  }
  return summary;
}

