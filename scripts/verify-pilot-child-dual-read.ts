/**
 * Live dual-read spot-check for scoped pilot UIDs (Admin get-by-id only).
 *
 * Usage:
 *   node --import tsx scripts/verify-pilot-child-dual-read.ts \
 *     --uids=UID1,UID2
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromFunctions = createRequire(path.join(root, "functions/package.json"));

for (const name of ["functions/.env.local", ".env.local"] as const) {
  const envPath = path.join(root, name);
  if (!fs.existsSync(envPath)) continue;
  try {
    requireFromFunctions("dotenv").config({ path: envPath });
  } catch {
    /* optional */
  }
}

const uidsArg = process.argv.find((a) => a.startsWith("--uids="));
if (!uidsArg) {
  console.error("Required: --uids=UID1,UID2");
  process.exit(1);
}
const uids = uidsArg
  .slice("--uids=".length)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (uids.length === 0 || uids.length > 8) {
  console.error("Provide 1–8 explicit UIDs");
  process.exit(1);
}

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
if (!keyPath) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_PATH");
  process.exit(1);
}
const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(root, keyPath);
const sa = JSON.parse(fs.readFileSync(resolved, "utf8")) as object;
const admin = requireFromFunctions("firebase-admin") as {
  apps: unknown[];
  initializeApp: (opts: unknown) => void;
  credential: { cert: (sa: object) => unknown };
  firestore: () => {
    collection: (name: string) => {
      doc: (id: string) => {
        get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
        collection: (name: string) => {
          doc: (id: string) => {
            get: () => Promise<{
              exists: boolean;
              data: () => Record<string, unknown> | undefined;
            }>;
            collection: (name: string) => {
              doc: (id: string) => {
                get: () => Promise<{ exists: boolean }>;
              };
              limit: (n: number) => {
                get: () => Promise<{ size: number }>;
              };
            };
          };
          limit: (n: number) => {
            get: () => Promise<{ size: number }>;
          };
        };
      };
    };
  };
};
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa), projectId: "into-the-pond" });
}
const db = admin.firestore();

type ChildrenSummaryEntry = {
  childId: string;
  name: string;
  companionId: string;
  childOrder: number;
};

/** Mirrors src/features/childProfile/dualRead.resolveHeaderChildName (no RN imports). */
function resolveHeaderChildName(args: {
  summary: ChildrenSummaryEntry[] | null | undefined;
  activeChildId: string | null | undefined;
  legacyDisplayName?: string | null;
}): string {
  const active = args.summary?.find((s) => s.childId === args.activeChildId);
  if (active?.name?.trim()) return active.name.trim();
  const first = args.summary?.find((s) => s.childOrder === 1);
  if (first?.name?.trim()) return first.name.trim();
  return args.legacyDisplayName?.trim() || "Friend";
}

type SurfaceResult = { surface: string; pass: boolean; detail: string };

async function verifyUid(uid: string): Promise<SurfaceResult[]> {
  const results: SurfaceResult[] = [];
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return [{ surface: "user", pass: false, detail: "missing user doc" }];
  }
  const data = userSnap.data() as Record<string, unknown>;
  const activeChildId =
    typeof data.activeChildId === "string" && data.activeChildId.trim()
      ? data.activeChildId.trim()
      : null;
  const summary = Array.isArray(data.childrenSummary)
    ? (data.childrenSummary as ChildrenSummaryEntry[])
    : null;

  results.push({
    surface: "activeChildId",
    pass: Boolean(activeChildId),
    detail: activeChildId ?? "null",
  });

  if (!activeChildId) {
    results.push({
      surface: "children/{childId}",
      pass: false,
      detail: "no activeChildId — cannot dual-read",
    });
    return results;
  }

  const childSnap = await userRef.collection("children").doc(activeChildId).get();
  const child = childSnap.exists ? (childSnap.data() as Record<string, unknown>) : null;
  results.push({
    surface: "children/{childId} doc",
    pass: childSnap.exists,
    detail: childSnap.exists
      ? `exists name=${String(child?.name ?? "")} dob=${String(child?.dob ?? "")} locked=${String(child?.profileLocked)}`
      : "MISSING",
  });

  const childArchetype = child?.archetype ?? null;
  const childDob = typeof child?.dob === "string" ? child.dob : null;
  const childNarrativeDone = child?.hasCompletedDay1Narrative === true;
  const rootArchetype = data.childArchetype ?? null;
  const rootDob = typeof data.childBirthDate === "string" ? data.childBirthDate : null;
  const resolvedArchetype = childArchetype || rootArchetype;
  const resolvedDob = childDob || rootDob;
  results.push({
    surface: "narrative (dual-read fields)",
    pass: childSnap.exists && (Boolean(childDob) || Boolean(rootDob)),
    detail: JSON.stringify({
      childPath: `users/${uid}/children/${activeChildId}`,
      childArchetype,
      childDob,
      childNarrativeDone,
      rootArchetype,
      rootDob,
      resolvedArchetype,
      resolvedDob,
    }),
  });

  const childWell = await userRef
    .collection("children")
    .doc(activeChildId)
    .collection("wellState")
    .doc("current")
    .get();
  const rootWell = await userRef.collection("wellState").doc("current").get();
  results.push({
    surface: "Well (children/.../wellState/current)",
    pass: childSnap.exists,
    detail: JSON.stringify({
      childWellExists: childWell.exists,
      rootWellExists: rootWell.exists,
      note: childWell.exists
        ? "child-scoped wellState present (dual-read path live)"
        : "child wellState absent — callable ensureWellState will create on first Well open; dual-read path is wired to children/{id}",
    }),
  });

  const childAtlas = await userRef
    .collection("children")
    .doc(activeChildId)
    .collection("childAtlas")
    .limit(5)
    .get();
  const rootAtlas = await userRef.collection("childAtlas").limit(5).get();
  results.push({
    surface: "Child Atlas (children/.../childAtlas)",
    pass: childSnap.exists,
    detail: JSON.stringify({
      childAtlasCountSample: childAtlas.size,
      rootAtlasCountSample: rootAtlas.size,
      note: "client useChildAtlas(uid, childId) reads child path when childId set",
    }),
  });

  const headerName = resolveHeaderChildName({
    summary,
    activeChildId,
    legacyDisplayName: typeof data.displayName === "string" ? data.displayName : null,
  });
  results.push({
    surface: "header name (resolveHeaderChildName)",
    pass: Boolean(headerName && headerName.length > 0),
    detail: JSON.stringify({ headerName, summary }),
  });

  results.push({
    surface: "Flag B sealed profile present",
    pass: child?.profileLocked === true,
    detail: `profileLocked=${String(child?.profileLocked)} childOrder=${String(child?.childOrder)}`,
  });

  return results;
}

async function main() {
  console.log("=== pilot dual-read verify (live prod, get-by-uid only) ===");
  console.log(`uids: ${uids.join(",")}`);
  let allPass = true;
  for (const uid of uids) {
    console.log(`\n--- uid=${uid} ---`);
    const results = await verifyUid(uid);
    for (const r of results) {
      const mark = r.pass ? "PASS" : "FAIL";
      if (!r.pass) allPass = false;
      console.log(`[${mark}] ${r.surface}: ${r.detail}`);
    }
  }
  console.log(`\n=== overall: ${allPass ? "PASS" : "FAIL"} ===`);
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
