/**
 * ESLint rule: forbid importing reward-computation functions in client code.
 * Invariant 6 — rewards calculated on server only.
 * Allowlist: DEV preview modules and in-memory test stubs.
 */

const BANNED_IMPORTS = new Set([
  "wonderAmountForRule",
  "resolveFishingClaim",
  "resolveFishingClaimFromContext",
  "catchChance",
  "computePartsAwardForLessonCompletion",
  "grantDuplicateCompensation",
]);

const ALLOWLISTED_PATHS = [
  "src/features/fishing/resolveDevFishingClaim.ts",
  "src/features/well/wellDevPreview.ts",
  "src/repositories/sanctuary/inMemoryWonderRepository.ts",
  "shared/sanctuary/",
];

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
        "Disallow importing server-authoritative reward formulas in client src (Invariant 6)",
    },
    schema: [],
    messages: {
      bannedImport:
        'Client cannot import "{{name}}" for reward computation — use callable response amounts.',
    },
  },
  create(context) {
    if (isAllowlisted(context.filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (!node.source || node.source.type !== "Literal") return;

        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          const imported =
            specifier.imported.type === "Identifier"
              ? specifier.imported.name
              : specifier.imported.type === "Literal"
                ? String(specifier.imported.value)
                : null;
          if (imported && BANNED_IMPORTS.has(imported)) {
            context.report({
              node: specifier,
              messageId: "bannedImport",
              data: { name: imported },
            });
          }
        }
      },
    };
  },
};
