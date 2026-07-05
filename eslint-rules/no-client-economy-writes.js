/**
 * ESLint rule: forbid economy field names in client Firestore writes to users/{uid}.
 * Registry: shared/firestore/economyFieldRegistry.ts
 */

const ECONOMY_USER_FIELD_KEYS = new Set([
  "totalWonder",
  "currentWonder",
  "storedWonder",
  "lifetimeWonderEarned",
  "lastReflectionAt",
  "inventory",
  "activeCast",
  "fishingWonderToday",
  "lastFishingResetDate",
  "dailyQuestionCount",
  "lastQuestionResetDate",
  "activeRod",
  "rodDullnessCount",
  "isRodDull",
  "equippedRodId",
  "subscription",
  "completedLessons",
]);

const ALLOWLISTED_FILES = new Set(["src/services/firebase/firestore.ts"]);

function isUsersCollectionArg(node) {
  if (node.type === "Literal" && node.value === "users") return true;
  if (
    node.type === "TemplateLiteral" &&
    node.quasis.length === 1 &&
    node.quasis[0].value.cooked === "users"
  ) {
    return true;
  }
  return false;
}

function collectEconomyKeysFromObject(node, found) {
  if (!node || node.type !== "ObjectExpression") return;
  for (const prop of node.properties) {
    if (prop.type !== "Property") continue;
    const keyName =
      prop.key.type === "Identifier"
        ? prop.key.name
        : prop.key.type === "Literal"
          ? String(prop.key.value)
          : null;
    if (keyName && ECONOMY_USER_FIELD_KEYS.has(keyName)) {
      found.push({ key: keyName, node: prop.key });
    }
  }
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow economy field names in client Firestore writes to users collection",
    },
    schema: [],
    messages: {
      economyField:
        'Client cannot write economy field "{{field}}" to users/{uid}. Use a Cloud Function.',
      usersWrite:
        "Direct setDoc on users/{uid} must go through setDocument() with client-safe fields only.",
    },
  },
  create(context) {
    const filename = context.filename.replace(/\\/g, "/");
    const isAllowlisted = [...ALLOWLISTED_FILES].some((f) => filename.endsWith(f));

    function checkUsersWritePayload(args, payloadIndex) {
      if (isAllowlisted) return;
      const collectionArg = args[payloadIndex - 2] ?? args[0];
      if (!isUsersCollectionArg(collectionArg)) return;

      const payload = args[payloadIndex];
      if (!payload) return;

      const found = [];
      collectEconomyKeysFromObject(payload, found);
      for (const { key, node } of found) {
        context.report({ node, messageId: "economyField", data: { field: key } });
      }
    }

    return {
      CallExpression(node) {
        if (isAllowlisted) return;

        const callee = node.callee;
        if (callee.type === "Identifier" && callee.name === "setDocument") {
          checkUsersWritePayload(node.arguments, 2);
          return;
        }

        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "setDoc"
        ) {
          context.report({ node, messageId: "usersWrite" });
        }
      },
    };
  },
};
