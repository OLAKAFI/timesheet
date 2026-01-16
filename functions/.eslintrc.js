module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "max-len": ["error", { "code": 120 }],
    "indent": ["error", 2],
    "no-trailing-spaces": "off",
    "object-curly-spacing": ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],
    "arrow-parens": ["error", "always"],
    "eol-last": "off",
  },
};