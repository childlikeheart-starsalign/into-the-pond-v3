import type { WonderAccount, WonderTransaction } from "@/src/domain/sanctuary";
import { randomBytes } from "crypto";
import {
  applyWonderEarn,
  createEmptyWonderAccount,
  migrateFromLegacyTotalWonder,
} from "../../../shared/sanctuary/wonder/ledger";
import {
  DIARY_WONDER_BY_DEPTH,
  PRACTICE_WONDER_BY_KIND,
  WELL_QUESTION_ANSWERED,
  WELL_QUESTION_RECORDED,
  wonderAmountForRule,
} from "../../../shared/sanctuary/wonder/rules";
import type { WonderRepository } from "./interfaces";
import type { DiaryReflectionDepth, PracticeKind } from "../../../shared/sanctuary/types";

type MemoryStore = {
  accounts: Map<string, WonderAccount>;
  transactions: Map<string, WonderTransaction[]>;
};

const store: MemoryStore = {
  accounts: new Map(),
  transactions: new Map(),
};

function txId(prefix: string) {
  return `${prefix}_${Date.now()}_${randomBytes(8).toString("hex")}`;
}

/** TEST/DEV STUB ONLY — violates Invariant 6 if used for production grants. */
export function createInMemoryWonderRepository(): WonderRepository {
  if (!__DEV__) {
    throw new Error("createInMemoryWonderRepository is DEV/test only (Invariant 6)");
  }
  return {
    async getAccount(userId) {
      return store.accounts.get(userId) ?? createEmptyWonderAccount(userId);
    },
    async saveAccount(account) {
      store.accounts.set(account.userId, account);
    },
    async appendTransaction(transaction) {
      const list = store.transactions.get(transaction.userId) ?? [];
      list.unshift(transaction);
      store.transactions.set(transaction.userId, list);
    },
    async listTransactions(userId, limit = 50) {
      return (store.transactions.get(userId) ?? []).slice(0, limit);
    },
    async earnFromDiary(userId, depth, entryInput) {
      const rule = DIARY_WONDER_BY_DEPTH[depth];
      const amount = wonderAmountForRule(rule, `${userId}:${entryInput.createdAt}`);
      const account = store.accounts.get(userId) ?? createEmptyWonderAccount(userId);
      const { account: next, transaction } = applyWonderEarn({
        account,
        source: rule.source,
        amount,
        transactionId: txId("diary"),
        metadata: { depth, lessonId: entryInput.lessonId },
      });
      store.accounts.set(userId, next);
      await this.appendTransaction(transaction);
      return {
        entry: { ...entryInput, id: txId("entry"), wonderAwarded: amount },
        transaction,
      };
    },
    async earnFromWellQuestion(userId, questionInput) {
      const amount = wonderAmountForRule(WELL_QUESTION_RECORDED, questionInput.questionText);
      const account = store.accounts.get(userId) ?? createEmptyWonderAccount(userId);
      const { account: next, transaction } = applyWonderEarn({
        account,
        source: WELL_QUESTION_RECORDED.source,
        amount,
        transactionId: txId("well_q"),
      });
      store.accounts.set(userId, next);
      await this.appendTransaction(transaction);
      return {
        question: { ...questionInput, id: txId("well"), wonderAwarded: amount },
        transaction,
      };
    },
    async earnFromWellAnswer(userId, answerInput) {
      const amount = wonderAmountForRule(WELL_QUESTION_ANSWERED, answerInput.answerText);
      const account = store.accounts.get(userId) ?? createEmptyWonderAccount(userId);
      const { account: next, transaction } = applyWonderEarn({
        account,
        source: WELL_QUESTION_ANSWERED.source,
        amount,
        transactionId: txId("well_a"),
        metadata: { questionId: answerInput.questionId },
      });
      store.accounts.set(userId, next);
      await this.appendTransaction(transaction);
      return {
        answer: { ...answerInput, wonderAwarded: amount },
        transaction,
      };
    },
    async earnFromPractice(userId, kind, note) {
      const rule = PRACTICE_WONDER_BY_KIND[kind];
      const amount = wonderAmountForRule(rule, `${userId}:${kind}:${Date.now()}`);
      const account = store.accounts.get(userId) ?? createEmptyWonderAccount(userId);
      const { account: next, transaction } = applyWonderEarn({
        account,
        source: rule.source,
        amount,
        transactionId: txId("practice"),
        metadata: { kind, note },
      });
      store.accounts.set(userId, next);
      await this.appendTransaction(transaction);
      return {
        completion: {
          id: txId("practice"),
          userId,
          kind,
          note,
          wonderAwarded: amount,
          completedAt: Date.now(),
        },
        transaction,
      };
    },
  };
}

export function seedWonderFromLegacy(userId: string, totalWonder: number) {
  store.accounts.set(userId, migrateFromLegacyTotalWonder(userId, totalWonder));
}

export function resetInMemoryWonderStore() {
  store.accounts.clear();
  store.transactions.clear();
}
