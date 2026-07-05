/**
 * Invariant 7 — reject ledger mutations outside commitEconomyAction.
 * Run: node functions/scripts/validate-ledger-immutability.js
 */
const fs = require("fs");
const path = require("path");

const SRC_ROOT = path.join(__dirname, "..", "src");
const COMMIT_FILE = path.join(SRC_ROOT, "sanctuary", "economy", "commitEconomyAction.ts");
const LEDGER_READ_ALLOWLIST = new Set([
  path.join(SRC_ROOT, "sanctuary", "economy", "compensateEconomyEntry.ts"),
  path.join(SRC_ROOT, "sanctuary", "economy", "reconcileUser.ts"),
  path.join(SRC_ROOT, "sanctuary", "economy", "computeEconomyProjection.ts"),
  path.join(SRC_ROOT, "sanctuary", "economy", "compactEconomyLedger.ts"),
  path.join(SRC_ROOT, "sanctuary", "claimEncounter.ts"),
]);

function walkTsFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "lib") continue;
      walkTsFiles(full, files);
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(full);
    }
  }
  return files;
}

function relativeSrc(filePath) {
  return path.relative(SRC_ROOT, filePath).split(path.sep).join("/");
}

function validateEconomyLedgerReferences(files) {
  const violations = [];

  for (const file of files) {
    if (file === COMMIT_FILE || LEDGER_READ_ALLOWLIST.has(file)) continue;
    const rel = relativeSrc(file);
    const content = fs.readFileSync(file, "utf8");
    if (content.includes('collection("economyLedger")')) {
      violations.push(`${rel}: references collection("economyLedger") outside commitEconomyAction`);
    }
  }

  return violations;
}

function txSetBlocks(content) {
  const blocks = [];
  const re = /tx\.set\(/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const start = match.index;
    let depth = 0;
    let end = start;
    for (let i = start; i < content.length; i += 1) {
      const ch = content[i];
      if (ch === "(") depth += 1;
      if (ch === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    blocks.push(content.slice(start, end));
  }
  return blocks;
}

function validateLedgerMutationPatterns(files) {
  const violations = [];

  for (const file of files) {
    const rel = relativeSrc(file);
    const content = fs.readFileSync(file, "utf8");

    for (const block of txSetBlocks(content)) {
      if (!block.includes('collection("economyLedger")')) continue;
      if (/merge:\s*true/.test(block)) {
        violations.push(`${rel}: merge:true on economyLedger tx.set`);
      }
    }

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.includes("economyLedger")) continue;
      if (/\btx\.update\s*\(/.test(line) || /\b\.update\s*\(/.test(line)) {
        violations.push(`${rel}:${i + 1}: tx.update on economyLedger path`);
      }
    }
  }

  return violations;
}

function validateCommitUsesBareSet(files) {
  const content = fs.readFileSync(COMMIT_FILE, "utf8");
  const violations = [];

  if (!content.includes('collection("economyLedger")')) {
    violations.push("commitEconomyAction.ts: missing economyLedger write");
  }

  const ledgerSet = txSetBlocks(content).find((block) =>
    block.includes('collection("economyLedger")'),
  );
  if (ledgerSet && /merge:\s*true/.test(ledgerSet)) {
    violations.push("commitEconomyAction.ts: economyLedger tx.set must not use merge:true");
  }

  return violations;
}

const files = walkTsFiles(SRC_ROOT);
const violations = [
  ...validateEconomyLedgerReferences(files),
  ...validateLedgerMutationPatterns(files),
  ...validateCommitUsesBareSet(files),
];

if (violations.length > 0) {
  console.error("Ledger immutability validation failed:\n");
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(`Ledger immutability OK (${files.length} source files scanned)`);
