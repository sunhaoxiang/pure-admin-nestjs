module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  root: true,
  env: {
    node: true,
    jest: true,
  },
  plugins: [
    '@typescript-eslint',
    'jest',
    'prettier',
    'import',
    'unused-imports',
  ],
  extends: [
    // airbnb
    // https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb
    'airbnb-base',
    // airbnb typescript
    // https://github.com/iamturns/eslint-config-airbnb-typescript
    'airbnb-typescript/base',

    // typescript
    // https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/README.md
    // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    // jest
    'plugin:jest/recommended',
    // prettier
    // https://github.com/prettier/eslint-config-prettier#readme
    'prettier',
    // Runs Prettier as an ESLint rule and reports differences as individual ESLint issues
    // https://github.com/prettier/eslint-plugin-prettier
    'plugin:prettier/recommended',
  ],
  rules: {
    /* ********************************** ES6+ ********************************** */
    'no-console': 0,
    'no-var-requires': 0,
    'no-restricted-syntax': 0,
    'no-continue': 0,
    'no-await-in-loop': 0,
    'no-return-await': 0,
    'no-unused-vars': 0,
    'no-multi-assign': 0,
    'no-param-reassign': [2, { props: false }],
    'import/prefer-default-export': 0,
    'import/no-cycle': 0,
    'import/no-dynamic-require': 0,
    'max-classes-per-file': 0,
    'class-methods-use-this': 0,
    'guard-for-in': 0,
    'no-underscore-dangle': 0,
    'no-plusplus': 0,
    'no-lonely-if': 0,
    'no-bitwise': ['error', { allow: ['~'] }],

    /* ********************************** Module Import ********************************** */

    'import/no-absolute-path': 0,
    'import/extensions': 0,
    'import/no-named-default': 0,
    'no-restricted-exports': 0,

    // Forbid the use of extraneous packages
    'import/no-extraneous-dependencies': [
      1,
      {
        devDependencies: [
          '**/*.test.{ts,js}',
          '**/*.spec.{ts,js}',
          './test/**.{ts,js}',
          './scripts/**/*.{ts,js}',
        ],
      },
    ],
    // Enforce a convention in module import order
    'import/order': [
      1,
      {
        pathGroups: [
          {
            pattern: '@/**',
            group: 'external',
            position: 'after',
          },
        ],
        alphabetize: { order: 'asc', caseInsensitive: false },
        'newlines-between': 'always-and-inside-groups',
        warnOnUnassignedImports: true,
      },
    ],
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      },
    ],
    // Find and remove unused es6 module imports
    // https://github.com/sweepline/eslint-plugin-unused-imports
    'unused-imports/no-unused-imports': 0,
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'none',
        ignoreRestSiblings: true,
      },
    ],
    /* ********************************** Typescript ********************************** */
    '@typescript-eslint/no-unused-vars': 0,
    '@typescript-eslint/no-empty-interface': 0,
    '@typescript-eslint/no-this-alias': 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/explicit-member-accessibility': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-unnecessary-type-assertion': 0,
    '@typescript-eslint/require-await': 0,
    '@typescript-eslint/no-for-in-array': 0,
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/restrict-template-expressions': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-unsafe-return': 0,
    '@typescript-eslint/no-unused-expressions': 0,
    '@typescript-eslint/no-misused-promises': 0,
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/no-unsafe-call': 0,
    '@typescript-eslint/no-unsafe-argument': 0,
    '@typescript-eslint/ban-ts-comment': 0,
  },
  settings: {
    extensions: ['.ts', '.d.ts', '.cts', '.mts', '.js', '.cjs', 'mjs', '.json'],
  },
};
