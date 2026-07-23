/**
 * Grant roles/run.invoker to allUsers on Gen2 callable Cloud Run services.
 *
 * Why: without public invoker, Cloud Run returns 401 invalid_token when the
 * client sends a Firebase ID token (IAM intercepts before the callable runs).
 *
 * Auth (in order):
 *   1. Firebase CLI user login (configstore) — default; needs Owner/Editor
 *   2. FIREBASE_SERVICE_ACCOUNT_PATH if --sa is passed (needs run.admin)
 *
 * Usage:
 *   node scripts/grant-callable-public-invoker.mjs createcast
 *   node scripts/grant-callable-public-invoker.mjs createcast claimcast
 *   node scripts/grant-callable-public-invoker.mjs --sa createcast
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
const { GoogleAuth, OAuth2Client } = require("google-auth-library");
const Configstore = require("configstore");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(repoRoot, "functions", ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env") });

const PROJECT = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "into-the-pond";
const REGION = process.env.FUNCTIONS_REGION || "asia-east2";

const DEFAULT_SERVICES = [
  "createcast",
  "claimcast",
  "ensurewellstate",
  "requestaccountdeletion",
  "requestaccountdeletionbyemail",
  "cancelaccountdeletion",
  "getaccountdeletionstatus",
  "confirmaccountdeletionweb",
];

const args = process.argv.slice(2);
const useSa = args.includes("--sa");
const services = args.filter((a) => a !== "--sa").map((s) => s.toLowerCase());
const targets = services.length > 0 ? services : DEFAULT_SERVICES;

const MEMBER = "allUsers";
const ROLE = "roles/run.invoker";

function dbg(message, data) {
  if (process.env.DEBUG_INVOKER !== "1") return;
  console.error("[grant-invoker]", message, JSON.stringify(data));
}
async function clientFromFirebaseCli() {
  const conf = new Configstore("firebase-tools");
  const tokens = conf.get("tokens");
  const user = conf.get("user");
  if (!tokens?.refresh_token && !tokens?.access_token) {
    throw new Error("No Firebase CLI tokens. Run: npm run firebase:login");
  }
  // Same OAuth client firebase-tools uses (see firebase-tools/lib/api.js).
  const { clientId, clientSecret } = require("firebase-tools/lib/api");
  const oauth = new OAuth2Client(clientId(), clientSecret());
  oauth.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expires_at,
  });
  const access = await oauth.getAccessToken();
  if (!access?.token) {
    throw new Error("Could not refresh Firebase CLI access token");
  }
  dbg("auth mode", { mode: "firebase-cli", email: user?.email || null, hasToken: true });
  return oauth;
}

async function clientFromServiceAccount() {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!keyPath) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_PATH");
  }
  const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(repoRoot, keyPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Service account file not found: ${resolved}`);
  }
  const auth = new GoogleAuth({
    keyFile: resolved,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  dbg("auth mode", { mode: "service-account", hasToken: true });
  return auth.getClient();
}

async function getPolicy(client, service) {
  const url = `https://run.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/services/${service}:getIamPolicy`;
  const res = await client.request({ url });
  return res.data;
}

async function setPolicy(client, service, policy) {
  const url = `https://run.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/services/${service}:setIamPolicy`;
  const res = await client.request({
    url,
    method: "POST",
    data: { policy },
  });
  return res.data;
}

function ensurePublicInvoker(policy) {
  const bindings = Array.isArray(policy.bindings) ? [...policy.bindings] : [];
  const idx = bindings.findIndex((b) => b.role === ROLE);
  if (idx === -1) {
    bindings.push({ role: ROLE, members: [MEMBER] });
  } else {
    const members = new Set(bindings[idx].members || []);
    if (members.has(MEMBER)) {
      return { policy: { ...policy, bindings }, changed: false };
    }
    members.add(MEMBER);
    bindings[idx] = { ...bindings[idx], members: [...members] };
  }
  return { policy: { ...policy, bindings }, changed: true };
}

const client = useSa ? await clientFromServiceAccount() : await clientFromFirebaseCli();
let ok = 0;
let failed = 0;

for (const service of targets) {
  try {
    const current = await getPolicy(client, service);
    const { policy, changed } = ensurePublicInvoker(current);
    const hasAllUsers = (policy.bindings || []).some(
      (b) => b.role === ROLE && (b.members || []).includes(MEMBER),
    );
    if (changed) {
      await setPolicy(client, service, policy);
      console.log(`${service}: granted ${ROLE} → ${MEMBER}`);
    } else {
      console.log(`${service}: already has ${ROLE} → ${MEMBER}`);
    }
    dbg("invoker grant result", { service, changed, hasAllUsers, auth: useSa ? "sa" : "cli" });
    ok += 1;
  } catch (err) {
    failed += 1;
    const status = err.response?.status;
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`${service}: FAILED`, status || "", msg);
    dbg("invoker grant failed", {
      service,
      status: status ?? null,
      err: String(msg).slice(0, 400),
      auth: useSa ? "sa" : "cli",
    });
  }
}

console.log(`Done: ${ok} ok, ${failed} failed (auth=${useSa ? "service-account" : "firebase-cli"})`);
if (failed > 0 && !useSa) {
  console.error(
    "\nIf this failed with a domain/org-policy error, public invoker may be blocked in GCP.\n" +
      "Console fallback: Cloud Run → createcast → Permissions → Add principal → allUsers → Cloud Run Invoker.",
  );
}
process.exit(failed > 0 ? 1 : 0);
