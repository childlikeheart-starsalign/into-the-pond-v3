/**
 * Shared Change Request + second-approver gate for privileged migration tooling.
 * Export and rollback generators must call assertChangeRequestAuthorized() before any I/O.
 */
export type ChangeRequestAuth = {
  changeRequestId: string;
  approvedBy: string;
};

export function parseChangeRequestAuth(argv: string[]): ChangeRequestAuth | null {
  let changeRequestId = "";
  let approvedBy = "";
  for (const arg of argv) {
    if (arg.startsWith("--change-request-id=")) {
      changeRequestId = arg.slice("--change-request-id=".length).trim();
    }
    if (arg.startsWith("--approved-by=")) {
      approvedBy = arg.slice("--approved-by=".length).trim();
    }
  }
  if (!changeRequestId || !approvedBy) return null;
  return { changeRequestId, approvedBy };
}

/**
 * Fail closed unless both CR id and second human approver are present.
 * Does not embed export/rollback file paths in the denial message.
 */
export function assertChangeRequestAuthorized(
  argv: string[],
  operationLabel: string,
): ChangeRequestAuth {
  const auth = parseChangeRequestAuth(argv);
  if (!auth) {
    console.error(`[BLOCKED] ${operationLabel} requires authorization.`);
    console.error("Provide: --change-request-id=<CHANGE-REQUEST-ID> --approved-by=<manager>");
    console.error(
      "Open a Change Request before running privileged migration tooling. Runnable one-liners that bundle export+planner+rollback remain forbidden.",
    );
    process.exit(1);
  }
  if (!/^CR-[A-Za-z0-9][-A-Za-z0-9]*$/.test(auth.changeRequestId)) {
    console.error(
      `[BLOCKED] Invalid --change-request-id (expected CR-… ticket form): ${auth.changeRequestId}`,
    );
    process.exit(1);
  }
  if (auth.approvedBy.length < 2) {
    console.error("[BLOCKED] --approved-by must name a second human approver.");
    process.exit(1);
  }
  console.error(
    `[authorized] ${operationLabel} CR=${auth.changeRequestId} approved-by=${auth.approvedBy}`,
  );
  return auth;
}
