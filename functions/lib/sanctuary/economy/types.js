"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECONOMY_LEDGER_CHECKPOINT_DOC_ID = exports.EconomyError = void 0;
class EconomyError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "EconomyError";
  }
}
exports.EconomyError = EconomyError;
exports.ECONOMY_LEDGER_CHECKPOINT_DOC_ID = "summary";
