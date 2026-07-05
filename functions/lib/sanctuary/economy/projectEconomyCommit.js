"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectEconomyCommit = projectEconomyCommit;
const applyLedgerEntry_1 = require("./applyLedgerEntry");
function projectEconomyCommit(input) {
  (0, applyLedgerEntry_1.assertNonNegativeAccount)(input.nextAccount);
  return {
    nextAccount: input.nextAccount,
    entry: input.entry,
    userPatch: {
      ...(0, applyLedgerEntry_1.wonderFieldsPatchFromAccount)(input.nextAccount),
      ...(input.additionalUserPatch ?? {}),
    },
  };
}
