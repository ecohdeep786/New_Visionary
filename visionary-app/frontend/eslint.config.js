import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  { ignores: ["dist/**", "dist-ssr/**"] },
  {
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      "src/Layout.jsx",
    ],
    ignores: ["src/lib/**/*", "src/components/ui/**/*"],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      // Retaining JSX but dropping its import during a merge must fail lint.
      "react/jsx-no-undef": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    /* B1 voice→type ladder enforcement (docs/visionary/design/
       VOICE_TYPE_LADDER_2026-10-21.md): every landing heading declares a
       data-type role — never a raw fluid size. Scoped to the landing surface
       that FAP-46 covers; other public pages converge in B2/B3 and C. */
    files: [
      "src/pages/Landing.jsx",
      "src/pages/landing/StudentPage.jsx",
      "src/pages/landing/TeacherPage.jsx",
      "src/pages/landing/ParentPage.jsx",
      "src/pages/landing/CollegePage.jsx",
      "src/pages/landing/OrganizationPage.jsx",
      "src/components/landing/NewPersona.jsx",
      "src/components/landing/persona/PersonaSections.jsx",
      "src/components/landing/persona/PremiumPersonaSections.jsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXElement[name.name=/^h[123]$/]:not(:has(JSXAttribute[name.name='data-type']))",
          message:
            "Landing headings must declare a voice with data-type (docs/visionary/design/VOICE_TYPE_LADDER_2026-10-21.md).",
        },
        {
          selector:
            "JSXAttribute[name.name='className'][value.value=/text-\\[clamp\\(/]",
          message:
            "No raw fluid sizes on the landing — assign the data-type role from the voice→type ladder instead.",
        },
      ],
    },
  },
];
