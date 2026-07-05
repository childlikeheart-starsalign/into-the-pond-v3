/**
 * ESLint rule: forbid client-side authoritative fishing claim formulas.
 * Canonical source: shared/sanctuary/fishing/encounterEngine.ts
 */

const BANNED_DEFINITIONS = new Set([
  "catchChance",
  "consolationReward",
  "ENCOUNTER_RATES",
  "DUPLICATE_CONSOLATION",
  "MISS_CONSOLATION",
]);

const ALLOWLISTED_PATHS = ["shared/sanctuary/fishing/"];

function isAllowlisted(filename) {
  const normalized = filename.replace(/\\/g, "/");
  return ALLOWLISTED_PATHS.some((segment) => normalized.includes(segment));
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow defining fishing claim formulas outside shared/sanctuary/fishing (Invariant 5)",
    },
    schema: [],
    messages: {
      bannedFormula:
        'Client cannot define "{{name}}" — import from @/shared/sanctuary/fishing/encounterEngine.',
    },
  },
  create(context) {
    if (isAllowlisted(context.filename)) {
      return {};
    }

    function reportIfBanned(node, name) {
      if (BANNED_DEFINITIONS.has(name)) {
        context.report({ node, messageId: "bannedFormula", data: { name } });
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id?.name) reportIfBanned(node, node.id.name);
      },
      VariableDeclarator(node) {
        if (node.id.type === "Identifier") {
          reportIfBanned(node, node.id.name);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source) return;
        if (node.declaration?.type === "FunctionDeclaration" && node.declaration.id?.name) {
          reportIfBanned(node, node.declaration.id.name);
        }
        if (node.declaration?.type === "VariableDeclaration") {
          for (const decl of node.declaration.declarations) {
            if (decl.id.type === "Identifier") {
              reportIfBanned(node, decl.id.name);
            }
          }
        }
      },
    };
  },
};
