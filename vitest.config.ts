import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    globals: true,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['html'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
      include: ['packages/app'],
    },
  },
});