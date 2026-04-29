import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class LocalWellQuestion extends Model {
  static table = "local_well_questions";

  @field("uid") uid!: string;
  @field("question_id") questionId!: string;
  @field("question_text") questionText!: string;
  @field("answer_text") answerText!: string | null;
  @date("created_at") createdAt!: Date;
  @field("answered_at") answeredAtMs!: number | null;
  @readonly @date("updated_at") updatedAt!: Date;
}

