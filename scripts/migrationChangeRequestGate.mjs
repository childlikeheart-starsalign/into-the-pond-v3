/**
 * Shared Change Request + second-approver gate for privileged migration tooling.
 * @param {string[]} argv
 * @param {string} operationLabel
 * @returns {{ changeRequestId: string, approvedBy: string }}
 */
export function assertChangeRequestAuthorized(argv, operationLabel) {
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
  if (!changeRequestId || !approvedBy) {
    console.error(`[BLOCKED] ${operationLabel} requires authorization.`);
    console.error("Provide: --change-request-id=<CHANGE-REQUEST-ID> --approved-by=<manager>");
    console.error(
      "Open a Change Request before running privileged migration tooling. Runnable one-liners that bundle export+planner+rollback remain forbidden.",
    );
    process.exit(1);
  }
  if (!/^CR-[A-Za-z0-9][-A-Za-z0-9]*$/.test(changeRequestId)) {
    console.error(
      `[BLOCKED] Invalid --change-request-id (expected CR-… ticket form): ${changeRequestId}`,
    );
    process.exit(1);
  }
  if (approvedBy.length < 2) {
    console.error("[BLOCKED] --approved-by must name a second human approver.");
    process.exit(1);
  }
  console.error(
    `[authorized] ${operationLabel} CR=${changeRequestId} approved-by=${approvedBy}`,
  );
  return { changeRequestId, approvedBy };
}
