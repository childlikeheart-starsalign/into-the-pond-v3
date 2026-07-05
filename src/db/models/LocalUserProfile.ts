import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class LocalUserProfile extends Model {
  static table = "local_user_profile";

  @field("uid") uid!: string;
  @field("email") email!: string | null;
  @field("total_wonder") totalWonder!: number;
  @field("current_wonder") currentWonder!: number | null;
  @field("stored_wonder") storedWonder!: number | null;
  @field("lifetime_wonder_earned") lifetimeWonderEarned!: number | null;
  @field("last_reflection_at") lastReflectionAt!: number | null;
  @field("daily_question_count") dailyQuestionCount!: number;
  @field("fishing_wonder_today") fishingWonderToday!: number;
  @field("active_rod") activeRod!: string;
  @field("rod_dullness_count") rodDullnessCount!: number;
  @field("is_rod_dull") isRodDull!: boolean;
  @field("subscription_product_id") subscriptionProductId!: string | null;
  @field("subscription_expiry_ts") subscriptionExpiryTs!: number | null;
  @field("subscription_is_lifetime") subscriptionIsLifetime!: boolean;
  @field("subscription_status") subscriptionStatus!: string;
  @readonly @date("updated_at") updatedAt!: Date;
}
