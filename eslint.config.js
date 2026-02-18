import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import babelParser from "@babel/eslint-parser";
import globals from "globals";

export default [
    {
        ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
    },

    js.configs.recommended,

    {
        files: ["**/*.{js,jsx}"],
        plugins: {
            react,
            "react-hooks": reactHooks,
            "jsx-a11y": jsxA11y,
        },
        languageOptions: {
            parser: babelParser,
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                requireConfigFile: false,
                babelOptions: {
                    presets: ["@babel/preset-react"],
                },
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            indent: ["error", 4, { SwitchCase: 1 }],
            "react/jsx-indent": ["error", 4],
            "react/jsx-indent-props": ["error", 4],

            semi: ["error", "always"],

            "react/react-in-jsx-scope": "off",
            "react/jsx-uses-react": "off",
            "react/prop-types": "off",
            // Allow console in dev, warn in prod
            "no-console": process.env.NODE_ENV === "production"
                ? ["warn", { allow: ["warn", "error"] }]
                : "off",

            "no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
            "react/jsx-uses-vars": "error",



        },
    },
];
