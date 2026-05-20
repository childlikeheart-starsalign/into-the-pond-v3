export type ActiveRod = "basic" | "wooden" | "fiberglass";
export type SubscriptionStatus = "free" | "wooden" | "fiberglass";

export type SubscriptionState = {
  productId: string | null;
  expiryDate: FirebaseFirestore.Timestamp | null;
  isLifetime: boolean;
  subscriptionStatus: SubscriptionStatus;
  lastVerifiedAt: FirebaseFirestore.Timestamp;
  source: "revenuecat";
};

export type RevenueCatSubscriber = {
  subscriber?: {
    entitlements?: Record<
      string,
      {
        product_identifier?: string;
        expires_date?: string | null;
      }
    >;
    subscriptions?: Record<
      string,
      {
        expires_date?: string | null;
        original_purchase_date?: string | null;
        store_transaction_id?: string | null;
        is_sandbox?: boolean;
      }
    >;
    non_subscriptions?: Record<
      string,
      Array<{
        id?: string;
        purchase_date?: string | null;
        store_transaction_id?: string | null;
      }>
    >;
  };
};
