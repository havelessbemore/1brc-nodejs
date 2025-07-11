import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import globals from "globals";
import tseslint from "typescript-eslint";

// Ignore unused variables prefixed with an underscore
export const ignoreUnusedVariables = {
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
  },
};

export default defineConfig([
  {
    // Define global ignores. Must be used without
    // any other keys in the configuration object.
    ignores: ["dist", "package-lock.json", "tsconfig.json"],
  },
  // Apply JavaScript rules
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.node },
  },
  // Apply TypeScript rules
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  // Ignore unused variables prefixed with an underscore
  ignoreUnusedVariables,
  // Apply prettier rules
  eslintConfigPrettier,
]);
