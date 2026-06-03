/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  "*.{ts,mts,cts,js,mjs,cjs}": "oxlint --fix",
};
