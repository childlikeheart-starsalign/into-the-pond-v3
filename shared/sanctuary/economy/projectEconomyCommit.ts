import type { WonderAccount } from "../types";

import { assertNonNegativeAccount, wonderFieldsPatchFromAccount } from "./applyLedgerEntry";
import type { EconomyLedgerEntry } from "./types";

export type EconomyProjectedCommit = {
  nextAccount: WonderAccount;
  userPatch: Record<string, unknown>;
  entry: EconomyLedgerEntry;
};

export function projectEconomyCommit(input: {
  nextAccount: WonderAccount;
  entry: EconomyLedgerEntry;
  additionalUserPatch?: Record<string, unknown>;
}): EconomyProjectedCommit {
  assertNonNegativeAccount(input.nextAccount);

  return {
    nextAccount: input.nextAccount,
    entry: input.entry,
    userPatch: {
      ...wonderFieldsPatchFromAccount(input.nextAccount),
      ...(input.additionalUserPatch ?? {}),
    },
  };
}
