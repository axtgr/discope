/* eslint-env node */

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'prettier', 'prefer-let'],
  rules: {
    'prettier/prettier': 'error',
    'prefer-let/prefer-let': 'error',
    'prefer-const': 'off',
    'no-use-before-define': 'off',
    'no-useless-rename': 'error',
    quotes: ['error', 'single', { avoidEscape: true }],
    'no-useless-concat': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',
    'no-prototype-builtins': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    // This would be a good rule if TS were actually capable of tracing what
    // properties are assigned in methods called in a class constructor.
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-this-alias': 'off',
  },
}
