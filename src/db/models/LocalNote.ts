import { Model } from "@nozbe/watermelondb";
import { date, field } from "@nozbe/watermelondb/decorators";

export class LocalNote extends Model {
  static table = "local_notes";

  @field("title") title!: string;
  @field("body") body!: string;
  @date("updated_at") updatedAt!: Date;
}
