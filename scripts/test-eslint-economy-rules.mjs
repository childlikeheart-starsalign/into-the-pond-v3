/**
 * Smoke test for economy ESLint rules (Invariant 5 + 6).
 * Run: node scripts/test-eslint-economy-rules.mjs
 */
import assert from "node:assert/strict";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";

import noClientRewardComputation from "../eslint-rules/no-client-reward-computation.js";
import noLegacyCastClaim from "../eslint-rules/no-legacy-cast-claim.js";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
});

ruleTester.run("no-client-reward-computation", noClientRewardComputation, {
  valid: [
    {
      code: `import { PRACTICE_WONDER_BY_KIND } from "@/src/domain/sanctuary";`,
      filename: "/project/src/features/sanctuary/practiceCatalog.ts",
    },
    {
      code: `import { wonderAmountForRule } from "@/shared/sanctuary/wonder/rules";`,
      filename: "/project/src/features/well/wellDevPreview.ts",
    },
  ],
  invalid: [
    {
      code: `import { wonderAmountForRule } from "@/shared/sanctuary/wonder/rules";`,
      filename: "/project/src/features/sanctuary/SomeScreen.tsx",
      errors: [{ messageId: "bannedImport" }],
    },
    {
      code: `import { catchChance } from "@/shared/sanctuary/fishing/encounterEngine";`,
      filename: "/project/src/components/Foo.tsx",
      errors: [{ messageId: "bannedImport" }],
    },
  ],
});

ruleTester.run("no-legacy-cast-claim", noLegacyCastClaim, {
  valid: [
    {
      code: `import { claimCast } from "@/src/services/firebase/serverActions";`,
      filename: "/project/src/features/fishing/fishingServerCast.ts",
    },
    {
      code: `const callable = httpsCallable(functions, "claimCast");`,
      filename: "/project/src/services/firebase/serverActions.ts",
    },
  ],
  invalid: [
    {
      code: `import { requestCastClaim } from "@/src/services/firebase/castClaim";`,
      filename: "/project/src/features/Foo.tsx",
      errors: [{ messageId: "legacyImport" }],
    },
    {
      code: `const callable = httpsCallable(functions, "castClaim");`,
      filename: "/project/src/features/Foo.tsx",
      errors: [{ messageId: "legacyCallable" }],
    },
    {
      code: `export async function requestCastClaim() {}`,
      filename: "/project/src/features/Foo.tsx",
      errors: [{ messageId: "legacyIdentifier" }],
    },
  ],
});

console.log("eslint economy rules OK");
