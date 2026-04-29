import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class LocalLesson extends Model {
  static table = "local_lessons";

  @field("lesson_id") lessonId!: string;
  @field("lesson_order") lessonOrder!: number;
  @field("module") module!: number;
  @field("title") title!: string;
  @field("content") content!: string;
  @field("video_url") videoUrl!: string | null;
  @field("commitment_message") commitmentMessage!: string | null;
  @field("diary_prompts_json") diaryPromptsJson!: string;
  @field("is_placeholder") isPlaceholder!: boolean;
  @readonly @date("updated_at") updatedAt!: Date;
}

