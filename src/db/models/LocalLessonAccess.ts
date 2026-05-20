import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class LocalLessonAccess extends Model {
  static table = "lesson_access";

  @field("uid") uid!: string;
  @field("lesson_id") lessonId!: string;
  @field("is_unlocked") isUnlocked!: boolean;
  @field("is_completed") isCompleted!: boolean;
  @field("is_placeholder") isPlaceholder!: boolean;
  @field("requires_paywall") requiresPaywall!: boolean;
  @readonly @date("updated_at") updatedAt!: Date;
}
