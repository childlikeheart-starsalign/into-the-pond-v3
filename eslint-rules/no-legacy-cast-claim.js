/**
 * ESLint rule: forbid legacy castClaim callable — use claimCast via serverActions.
 * Invariant 8/10 — fishing rewards flow through claimCast only.
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow legacy castClaim callable and requestCastClaim wrapper",
    },
    schema: [],
    messages: {
      legacyImport:
        "Client cannot import from castClaim — use claimCast via serverActions / fishingServerCast.",
      legacyCallable: 'Client cannot call httpsCallable with "castClaim" — use claimCast instead.',
      legacyIdentifier: "requestCastClaim is removed — use claimCast via serverActions.",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (!node.source || node.source.type !== "Literal") return;
        const source = String(node.source.value);
        if (source.includes("castClaim")) {
          context.report({ node: node.source, messageId: "legacyImport" });
        }
      },
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "httpsCallable") {
          return;
        }
        const callableArg = node.arguments[1];
        if (callableArg?.type === "Literal" && callableArg.value === "castClaim") {
          context.report({ node: callableArg, messageId: "legacyCallable" });
        }
      },
      Identifier(node) {
        if (node.name !== "requestCastClaim") return;
        if (node.parent?.type === "ImportSpecifier") return;
        context.report({ node, messageId: "legacyIdentifier" });
      },
    };
  },
};
