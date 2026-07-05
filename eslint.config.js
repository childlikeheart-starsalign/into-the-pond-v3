const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const reactNativePlugin = require("eslint-plugin-react-native");
const prettierConfig = require("eslint-config-prettier");
const noClientEconomyWrites = require("./eslint-rules/no-client-economy-writes");
const noClientClaimFormulas = require("./eslint-rules/no-client-claim-formulas");
const noClientRewardComputation = require("./eslint-rules/no-client-reward-computation");
const noLegacyCastClaim = require("./eslint-rules/no-legacy-cast-claim");

module.exports = tseslint.config(
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-native": reactNativePlugin,
      local: {
        rules: {
          "no-client-economy-writes": noClientEconomyWrites,
          "no-client-claim-formulas": noClientClaimFormulas,
          "no-client-reward-computation": noClientRewardComputation,
          "no-legacy-cast-claim": noLegacyCastClaim,
        },
      },
    },

    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // React Native globals
        __DEV__: "readonly",
        fetch: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },

    settings: {
      react: { version: "detect" },
    },

    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // Not needed with React 17+ JSX transform
      "react/prop-types": "off", // TypeScript handles this

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Native
      "react-native/no-unused-styles": "warn",
      "react-native/no-inline-styles": "warn",
      "react-native/no-raw-text": "off", // Too noisy in practice

      // TypeScript
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off", // Config files use require()
      "local/no-client-economy-writes": "error",
      "local/no-client-claim-formulas": "error",
      "local/no-client-reward-computation": "error",
      "local/no-legacy-cast-claim": "error",
    },
  },

  // Disable ESLint rules that conflict with Prettier formatting
  prettierConfig,

  // Node.js CommonJS config files — give them require/module/process/__dirname globals
  {
    files: ["*.config.js", "babel.config.js", "metro.config.js"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "writable",
        exports: "writable",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
      },
    },
  },

  // Ignore generated, vendor, and backup directories
  {
    ignores: [
      "node_modules/**",
      "android/**",
      "ios/**",
      ".expo/**",
      "dist/**",
      "web-build/**",
      "functions/**",
      "scripts/**",
      "plugins/**",
      "tests/**",
      "Into-the-pond-v3-save/**",
      "docs/handoff/**/reference/**",
    ],
  },
);
