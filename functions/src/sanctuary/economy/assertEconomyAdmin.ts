import { HttpsError } from "firebase-functions/v2/https";
import { config } from "firebase-functions";

function parseAdminUids(): Set<string> {
  const fromEnv = process.env.ECONOMY_ADMIN_UIDS ?? "";
  const fromConfig = config().economy?.admin_uids ?? "";
  const combined = `${fromEnv},${fromConfig}`;
  return new Set(
    combined
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** Admin-only economy corrections (compensation entries). */
export function assertEconomyAdminOrThrow(
  uid: string | undefined,
  token: Record<string, unknown> | undefined,
): void {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (token?.economyAdmin === true) {
    return;
  }

  const allowlist = parseAdminUids();
  if (allowlist.has(uid)) {
    return;
  }

  throw new HttpsError("permission-denied", "Economy admin access required");
}
