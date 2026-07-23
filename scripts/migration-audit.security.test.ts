import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  assertChangeRequestAuthorized,
  parseChangeRequestAuth,
} from "./migrationChangeRequestGate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("parseChangeRequestAuth requires both flags", () => {
  assert.equal(parseChangeRequestAuth([]), null);
  assert.equal(parseChangeRequestAuth(["--change-request-id=CR-1"]), null);
  assert.deepEqual(parseChangeRequestAuth(["--change-request-id=CR-1", "--approved-by=alice"]), {
    changeRequestId: "CR-1",
    approvedBy: "alice",
  });
});

test("assertChangeRequestAuthorized rejects missing auth without throwing past exit", () => {
  const previousExit = process.exit;
  let code: number | undefined;
  // @ts-expect-error test stub
  process.exit = (c?: number) => {
    code = c ?? 0;
    throw new Error(`exit:${code}`);
  };
  try {
    assert.throws(() => assertChangeRequestAuthorized([], "test-op"), /exit:1/);
    assert.equal(code, 1);
  } finally {
    process.exit = previousExit;
  }
});

test("step0 guard exits 1 without CONFIRM_MIGRATION_AUDIT", () => {
  const result = spawnSync("bash", ["scripts/migration-audit-step0-guard.sh"], {
    cwd: root,
    env: { ...process.env, CONFIRM_MIGRATION_AUDIT: "" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /WARNING: children migration audit/);
});

test("planner --interactive fails closed without audit env", () => {
  const result = spawnSync(
    "node",
    [
      "--import",
      "tsx",
      "scripts/migrate-children-from-flat.ts",
      "--input=./tmp/children-migration-fixture.json",
      "--interactive",
    ],
    {
      cwd: root,
      env: { ...process.env, CONFIRM_MIGRATION_AUDIT: "" },
      encoding: "utf8",
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /CONFIRM_MIGRATION_AUDIT/);
});

test("planner dry-run on fixture prints summary without --write-plan", () => {
  const result = spawnSync(
    "node",
    [
      "--import",
      "tsx",
      "scripts/migrate-children-from-flat.ts",
      "--input=./tmp/children-migration-fixture.json",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /users scanned: 2/);
  assert.match(result.stdout, /would migrate: 1/);
  assert.match(result.stdout, /skip:no_child_specific_data: 1/);
  assert.match(result.stdout, /No durable plan file written/);
});

test("export script blocks without CR flags", () => {
  const result = spawnSync("node", ["functions/scripts/export-users-for-children-migration.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /\[BLOCKED\]/);
});

test("rollback script blocks without CR flags", () => {
  const result = spawnSync(
    "node",
    ["--import", "tsx", "scripts/rollback-children-migration-plan.ts"],
    { cwd: root, encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /\[BLOCKED\]/);
});
