import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class LocalCompletedLesson extends Model {
  static table = "local_completed_lessons";

  @field("uid") uid!: string;
  @field("lesson_id") lessonId!: string;
  @field("is_completed") isCompleted!: boolean;
  @readonly @date("updated_at") updatedAt!: Date;
}
