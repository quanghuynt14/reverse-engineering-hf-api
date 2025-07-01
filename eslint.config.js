import tseslint from "typescript-eslint";

import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

const eslintConfig = [
  ...tseslint.configs.recommendedTypeChecked,

  eslintPluginPrettierRecommended,

  {
    plugins: {},

    languageOptions: {
      parser: tseslint.parser,

      parserOptions: {
        project: "./tsconfig.json",

        ecmaVersion: "latest",

        sourceType: "module",

        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
];

export default eslintConfig;
