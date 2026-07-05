"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyWonderEarn = applyWonderEarn;
exports.applyWonderSpend = applyWonderSpend;
exports.investStoredWonderForRod = investStoredWonderForRod;
exports.spendCurrentWonderForBait = spendCurrentWonderForBait;
exports.createEmptyWonderAccount = createEmptyWonderAccount;
exports.migrateFromLegacyTotalWonder = migrateFromLegacyTotalWonder;
function cloneAccount(account) {
  return { ...account };
}
/** Earn Wonder — default credits both current and stored pools. */
function applyWonderEarn(input) {
  const { account, source, amount, transactionId, metadata = {}, pool = "both" } = input;
  if (amount <= 0) throw new Error("Earn amount must be positive");
  const next = cloneAccount(account);
  const now = Date.now();
  if (pool === "current" || pool === "both") {
    next.currentWonder += amount;
  }
  if (pool === "stored" || pool === "both") {
    next.storedWonder += amount;
    next.lifetimeWonderEarned += amount;
  }
  next.updatedAt = now;
  return {
    account: next,
    transaction: {
      id: transactionId,
      userId: account.userId,
      timestamp: now,
      source,
      amount,
      metadata,
    },
  };
}
/** Spend from exactly one pool — never mix. */
function applyWonderSpend(input) {
  const { account, source, amount, transactionId, metadata = {}, pool } = input;
  if (amount <= 0) throw new Error("Spend amount must be positive");
  const balance = pool === "current" ? account.currentWonder : account.storedWonder;
  if (balance < amount) {
    throw new Error(`Insufficient ${pool} Wonder`);
  }
  const next = cloneAccount(account);
  const now = Date.now();
  if (pool === "current") {
    next.currentWonder -= amount;
  } else {
    next.storedWonder -= amount;
  }
  next.updatedAt = now;
  return {
    account: next,
    transaction: {
      id: transactionId,
      userId: account.userId,
      timestamp: now,
      source,
      amount: -amount,
      metadata: { ...metadata, pool },
    },
  };
}
/** Rod crafting invests storedWonder only. */
function investStoredWonderForRod(account, transactionId, storedWonderCost, rodId) {
  return applyWonderSpend({
    account,
    source: "rod_craft_investment",
    amount: storedWonderCost,
    transactionId,
    pool: "stored",
    metadata: { rodId },
  });
}
/** Bait crafting spends currentWonder only. */
function spendCurrentWonderForBait(account, transactionId, currentWonderCost, baitTier) {
  return applyWonderSpend({
    account,
    source: "bait_craft",
    amount: currentWonderCost,
    transactionId,
    pool: "current",
    metadata: { baitTier },
  });
}
function createEmptyWonderAccount(userId) {
  return {
    userId,
    currentWonder: 0,
    storedWonder: 0,
    lifetimeWonderEarned: 0,
    updatedAt: Date.now(),
  };
}
/** Migrate legacy single-pool totalWonder into split pools. */
function migrateFromLegacyTotalWonder(userId, totalWonder) {
  return {
    userId,
    currentWonder: totalWonder,
    storedWonder: totalWonder,
    lifetimeWonderEarned: totalWonder,
    updatedAt: Date.now(),
  };
}
