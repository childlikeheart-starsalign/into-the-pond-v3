export type EconomyErrorCode =
  | "INSUFFICIENT_CURRENT_WONDER"
  | "INSUFFICIENT_STORED_WONDER"
  | "INSUFFICIENT_MATERIALS"
  | "INSUFFICIENT_PARTS"
  | "NEGATIVE_BALANCE"
  | "INVALID_DELTA";

export class EconomyError extends Error {
  readonly code: EconomyErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: EconomyErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "EconomyError";
    this.code = code;
    this.details = details;
  }
}
