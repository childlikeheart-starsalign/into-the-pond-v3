"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertActiveRodOrThrow = assertActiveRodOrThrow;
const https_1 = require("firebase-functions/v2/https");
const init_1 = require("./init");
const rank = {
  basic: 0,
  wooden: 1,
  fiberglass: 2,
};
async function assertActiveRodOrThrow(uid, options = {}) {
  const userRef = init_1.db.collection("users").doc(uid);
  const snapshot = await userRef.get();
  const data = snapshot.data() ?? {};
  const subscription = data.subscription ?? {};
  const activeRod =
    data.activeRod ??
    (subscription.subscriptionStatus === "fiberglass"
      ? "fiberglass"
      : subscription.subscriptionStatus === "wooden"
        ? "wooden"
        : "basic");
  const isLifetime = subscription.isLifetime ?? false;
  const expiryDate = subscription.expiryDate ?? null;
  const productId = subscription.productId ?? null;
  const now = Date.now();
  const notExpired = !expiryDate || expiryDate.toMillis() > now;
  const hasPaid = !!productId || isLifetime || activeRod !== "basic";
  if (!hasPaid && options.minRod !== "basic") {
    throw new https_1.HttpsError("permission-denied", "Subscription inactive");
  }
  if (isLifetime) return;
  if (!notExpired || rank[activeRod] < rank[options.minRod ?? "wooden"]) {
    throw new https_1.HttpsError("permission-denied", "Subscription inactive or insufficient tier");
  }
}
