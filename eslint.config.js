import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    // Entities/*.js are JSON schema documents, not JavaScript modules
    ignores: ["dist", "coverage", "node_modules", "backend/node_modules", "Entities"],
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "18.3" } },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      // `import React` is unneeded with the automatic JSX runtime but harmless, so don't flag it
      "no-unused-vars": ["warn", { varsIgnorePattern: "^(_|React$)", argsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
  {
    files: ["**/__tests__/**", "**/*.test.{js,jsx}", "src/test/**"],
    languageOptions: { globals: { ...globals.jest } },
  },
  {
    files: ["public/sw.js"],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
];
