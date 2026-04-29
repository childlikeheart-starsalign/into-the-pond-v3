import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class LocalInventory extends Model {
  static table = "local_inventory";

  @field("uid") uid!: string;
  @field("parts") parts!: number;
  @field("feather_bait") featherBait!: number;
  @field("scale_bait") scaleBait!: number;
  @field("glimmerdust_bait") glimmerdustBait!: number;
  @field("random_bait") randomBait!: number;
  @field("feather") feather!: number;
  @field("scale") scale!: number;
  @field("glimmerdust") glimmerdust!: number;
  @readonly @date("updated_at") updatedAt!: Date;
}

