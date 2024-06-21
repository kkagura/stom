module.exports = {
  env: {
    es6: true,
    browser: true,
    node: true
  },
  plugins: ['prettier'],
  parser: 'vue-eslint-parser',

  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-typescript/recommended',
    '@vue/eslint-config-prettier',
    'plugin:prettier/recommended'
  ],
  rules: {
    // js相关
    'no-console': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-useless-escape': 'off',
    'no-var': 'off',
    'no-async-promise-executor': 'off',
    'no-case-declarations': 'off',
    'no-empty': 'off',
    'no-prototype-builtins': 'off',
    'no-fallthrough': 'off',
    'no-unsafe-optional-chaining': 'off',
    'no-extra-boolean-cast': 'off',
    'no-irregular-whitespace': 'off',
    'prefer-const': 'off',
    // ts相关
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    // vue相关
    'vue/no-unused-vars': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-components': 'off',
    'vue/valid-v-for': 'off',
    'vue/require-v-for-key': 'off',
    'vue/no-expose-after-await': 'off',
    'vue/no-mutating-props': 'off',
    'vue/require-valid-default-prop': 'off',
    'vue/no-deprecated-v-bind-sync': 'off',
    'vue/no-deprecated-filter': 'off',
    'vue/no-deprecated-slot-attribute': 'off',
    'vue/no-deprecated-v-on-native-modifier': 'off',
    'vue/no-v-for-template-key-on-child': 'off',
    'vue/no-deprecated-html-element-is': 'off',
    'vue/no-useless-template-attributes': 'off',
    'vue/no-deprecated-dollar-listeners-api': 'off',
    'vue/no-deprecated-destroyed-lifecycle': 'off',
    'vue/no-parsing-error': [2, { 'x-invalid-end-tag': false }],
    'vue/no-deprecated-slot-scope-attribute': 'off',
    // prettier相关
    'prettier/prettier': 'off'
  }
};
