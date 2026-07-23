/**
 * [PRIVILEGED] Export users/{uid} (+ well/atlas/children) for children migration planning.
 *
 * [BLOCKED] without Change Request authorization:
 *   --change-request-id=CR-… --approved-by=<manager>
 *
 * Do NOT chain this with planner dry-run or rollback generation.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

const { assertChangeRequestAuthorized } = await import(
  pathToFileURL(path.join(root, "scripts/migrationChangeRequestGate.mjs")).href
);

assertChangeRequestAuthorized(
  process.argv.slice(2),
  "production user export for children migration",
);

const dotenv = require("dotenv");
dotenv.config({ path: path.join(root, "functions", ".env.local") });
dotenv.config({ path: path.join(root, ".env.local") });

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
if (!keyPath) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_PATH");
  process.exit(1);
}
const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(root, keyPath);
const sa = JSON.parse(fs.readFileSync(resolved, "utf8"));
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 0;

const db = admin.firestore();
const usersSnap = await db.collection("users").get();
const users = [];
let scanned = 0;
for (const doc of usersSnap.docs) {
  scanned += 1;
  if (limit > 0 && users.length >= limit) break;
  const data = doc.data() || {};
  const { email: _email, ...rest } = data;
  const wellState = await doc.ref.collection("wellState").doc("current").get();
  const wellQuestions = await doc.ref.collection("wellQuestions").limit(50).get();
  const childAtlas = await doc.ref.collection("childAtlas").limit(50).get();
  const children = await doc.ref.collection("children").limit(10).get();
  users.push({
    uid: doc.id,
    data: rest,
    wellStateCurrent: wellState.exists ? wellState.data() : null,
    wellQuestions: wellQuestions.docs.map((d) => ({ id: d.id, data: d.data() })),
    childAtlas: childAtlas.docs.map((d) => ({ id: d.id, data: d.data() })),
    children: children.docs.map((d) => ({ id: d.id, data: d.data() })),
  });
}

const outDir = path.join(root, "tmp");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "children-migration-prod-export.json");
fs.writeFileSync(
  outPath,
  JSON.stringify({ users, exportedAt: new Date().toISOString(), scanned }, null, 2),
);
console.log(JSON.stringify({ outPath, users: users.length, scanned }, null, 2));
