import assert from "node:assert/strict";
import test from "node:test";

import { migrations } from "./migrations";
import { schema } from "./schema";

test("schema version matches migrations maxVersion", () => {
  assert.equal(schema.version, 6);
  assert.equal(migrations.maxVersion, 6);
});

test("v6 migration rebuilds local_user_profile with Wonder columns idempotently", () => {
  const v6 = migrations.sortedMigrations.find((m) => m.toVersion === 6);
  assert.ok(v6, "expected toVersion 6 migration");
  const step = v6!.steps.find((s) => s.type === "sql");
  assert.ok(step, "expected sql rebuild step");
  assert.equal(step!.type, "sql");
  if (step!.type !== "sql") return;
  assert.match(step.sql, /local_user_profile_mig6/);
  assert.match(step.sql, /current_wonder/);
  assert.match(step.sql, /stored_wonder/);
  assert.match(step.sql, /lifetime_wonder_earned/);
  assert.match(step.sql, /last_reflection_at/);
  assert.match(step.sql, /DROP TABLE "local_user_profile"/);
});

test("schema local_user_profile includes Wonder columns", () => {
  const table = schema.tables.local_user_profile;
  assert.ok(table);
  const names = Object.keys(table.columns);
  assert.ok(names.includes("current_wonder"));
  assert.ok(names.includes("stored_wonder"));
  assert.ok(names.includes("lifetime_wonder_earned"));
  assert.ok(names.includes("last_reflection_at"));
});
