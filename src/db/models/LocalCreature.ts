import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class LocalCreature extends Model {
  static table = "local_creatures";

  @field("uid") uid!: string;
  @field("creature_id") creatureId!: string;
  @field("name") name!: string;
  @field("rarity") rarity!: "basic" | "rare" | "legendary";
  @date("caught_at") caughtAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
