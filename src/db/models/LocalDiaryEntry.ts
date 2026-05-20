import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export type LocalDiarySyncStatus = "synced" | "pending" | "failed";

export class LocalDiaryEntry extends Model {
  static table = "local_diary_entries";

  @field("entry_id") entryId!: string;
  @field("uid") uid!: string;
  @field("lesson_id") lessonId!: string | null;
  @field("source") source!: "lesson" | "reignite";
  @field("prompts_json") promptsJson!: string;
  @field("answers_json") answersJson!: string;
  @field("status") status!: "draft" | "completed";
  @field("wonder_awarded") wonderAwarded!: number;
  @field("plant_stage") plantStage!: number;
  @field("sync_status") queueStatus!: LocalDiarySyncStatus;
  @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
