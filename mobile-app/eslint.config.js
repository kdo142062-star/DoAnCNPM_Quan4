import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";

export default [
  { ignores: ["node_modules/**", ".expo/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { react },
    settings: { react: { version: "detect" } },
    rules: {
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
    },
  },
];
