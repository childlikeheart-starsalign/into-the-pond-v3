/**
 * Validates firestore.rules economy field / subcollection lists match
 * shared/firestore/economyFieldRegistry.ts
 *
 * Run: node functions/scripts/validate-firestore-rules-registry.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const RULES_PATH = path.join(ROOT, "firestore.rules");
const REGISTRY_PATH = path.join(ROOT, "shared", "firestore", "economyFieldRegistry.ts");

function extractStringArray(source, functionName) {
  const fnRegex = new RegExp(
    `function ${functionName}\\(\\)[^{]*\\{[\\s\\S]*?return \\[([\\s\\S]*?)\\];`,
    "m",
  );
  const match = source.match(fnRegex);
  if (!match) {
    throw new Error(`Could not find ${functionName}() array in firestore.rules`);
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractTsConstArray(source, constName) {
  const regex = new RegExp(`export const ${constName} = \\[([\\s\\S]*?)\\] as const;`, "m");
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Could not find ${constName} in economyFieldRegistry.ts`);
  }
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function assertSame(label, rulesList, registryList) {
  const rulesSet = new Set(rulesList);
  const registrySet = new Set(registryList);

  const missingInRules = registryList.filter((k) => !rulesSet.has(k));
  const extraInRules = rulesList.filter((k) => !registrySet.has(k));

  if (missingInRules.length > 0 || extraInRules.length > 0) {
    console.error(`Registry mismatch for ${label}:`);
    if (missingInRules.length > 0) {
      console.error(`  In registry but not rules: ${missingInRules.join(", ")}`);
    }
    if (extraInRules.length > 0) {
      console.error(`  In rules but not registry: ${extraInRules.join(", ")}`);
    }
    process.exit(1);
  }
}

function assertSubcollectionsInRules(rulesSource, registrySubcols) {
  const missing = registrySubcols.filter((name) => {
    const pattern = new RegExp(`match /${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`);
    return !pattern.test(rulesSource);
  });
  if (missing.length > 0) {
    console.error(
      `Subcollections in registry but not explicit in firestore.rules: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

function main() {
  const rulesSource = fs.readFileSync(RULES_PATH, "utf8");
  const registrySource = fs.readFileSync(REGISTRY_PATH, "utf8");

  const rulesEconomyKeys = extractStringArray(rulesSource, "economyFieldKeys");
  const registryEconomyKeys = extractTsConstArray(registrySource, "ECONOMY_USER_FIELD_KEYS");
  assertSame("ECONOMY_USER_FIELD_KEYS", rulesEconomyKeys, registryEconomyKeys);

  const registrySubcols = extractTsConstArray(registrySource, "ECONOMY_SUBCOLLECTIONS");
  assertSubcollectionsInRules(rulesSource, registrySubcols);

  const rulesClientSafeKeys = extractStringArray(rulesSource, "clientSafeUserCreateKeys");
  const registryClientSafeKeys = extractTsConstArray(
    registrySource,
    "CLIENT_SAFE_USER_CREATE_KEYS",
  );
  if (rulesClientSafeKeys.length > 0) {
    assertSame("CLIENT_SAFE_USER_CREATE_KEYS", rulesClientSafeKeys, registryClientSafeKeys);
  }

  console.log(
    `Validated firestore.rules ↔ economyFieldRegistry (${registryEconomyKeys.length} economy fields, ${registrySubcols.length} subcollections)`,
  );
}

main();
