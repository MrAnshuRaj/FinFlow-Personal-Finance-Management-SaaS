import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/coverage/**", "**/next-env.d.ts"] },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off"
    }
  }
);
