import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Allows using 'describe', 'test', 'expect' globally
    environment: 'node',
  },
});
