import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // global-error.tsx renders its own <html>/<body> outside the Next.js router,
  // so using a plain <a> tag (instead of next/link) is intentionally correct here.
  {
    files: ["app/global-error.tsx"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  // TanStack Table's useReactTable() returns functions that the React Compiler
  // cannot safely memoize — this is a known library limitation, not a code issue.
  // The "use no memo" directive inside the component opts it out of compilation.
  {
    files: ["components/data-table.tsx"],
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },
]);

export default eslintConfig;
