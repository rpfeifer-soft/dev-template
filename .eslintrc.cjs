/*
👋 Hi! This file was autogenerated by tslint-to-eslint-config.
https://github.com/typescript-eslint/tslint-to-eslint-config

It represents the closest reasonable ESLint configuration to this
project's original TSLint configuration.

We recommend eventually switching this configuration to extend from
the recommended rulesets in typescript-eslint. 
https://github.com/typescript-eslint/tslint-to-eslint-config/blob/master/docs/FAQs.md

Happy linting! 💖
*/
module.exports = {
   env: {
      browser: true,
      es6: true,
      node: true,
   },
   extends: [
      "google",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "prettier",
   ],
   parser: "@typescript-eslint/parser",
   parserOptions: {
      project: "./src/tsconfig.test.json",
      sourceType: "module",
   },
   plugins: ["@typescript-eslint"],
   ignorePatterns: ["i18n.js", "*.cjs", "src/shared/i18n/*.ts"],
   rules: {
      "require-jsdoc": "off",
      "@typescript-eslint/dot-notation": "error",
      "@typescript-eslint/indent": [
         "off",
         4,
         {
            CallExpression: {
               arguments: "first",
            },
            FunctionDeclaration: {
               parameters: "first",
            },
            FunctionExpression: {
               parameters: "first",
            },
         },
      ],
      "@typescript-eslint/member-delimiter-style": [
         "error",
         {
            multiline: {
               delimiter: "semi",
               requireLast: true,
            },
            singleline: {
               delimiter: "semi",
               requireLast: false,
            },
         },
      ],
      "@typescript-eslint/member-ordering": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/quotes": ["error", "single"],
      "@typescript-eslint/semi": ["error", "always"],
      "@typescript-eslint/type-annotation-spacing": "error",
      "brace-style": ["error", "1tbs"],
      camelcase: "error",
      "comma-dangle": "off",
      curly: "error",
      "default-case": "error",
      "eol-last": "off",
      eqeqeq: ["error", "always"],
      "guard-for-in": "error",
      "id-blacklist": [
         "error",
         "any",
         "Number",
         "number",
         "String",
         "string",
         "Boolean",
         "boolean",
         "Undefined",
         "undefined",
      ],
      "id-match": "error",
      "max-len": [
         "error",
         {
            code: 120,
         },
      ],
      "no-bitwise": "error",
      "no-caller": "error",
      "no-console": [
         "error",
         {
            allow: [
               "warn",
               "dir",
               "timeLog",
               "assert",
               "clear",
               "count",
               "countReset",
               "group",
               "groupEnd",
               "table",
               "dirxml",
               "groupCollapsed",
               "Console",
               "profile",
               "profileEnd",
               "timeStamp",
               "context",
            ],
         },
      ],
      "no-debugger": "error",
      "no-empty": "error",
      "no-eval": "error",
      "no-fallthrough": "error",
      "no-multiple-empty-lines": "error",
      "no-new-wrappers": "error",
      "no-redeclare": "error",
      "no-shadow": [
         "error",
         {
            hoist: "all",
         },
      ],
      "no-trailing-spaces": "off",
      "no-underscore-dangle": "error",
      "no-unused-labels": "error",
      "no-var": "error",
      radix: "error",
      "spaced-comment": [
         "error",
         "always",
         {
            markers: ["/"],
         },
      ],
   },
};
