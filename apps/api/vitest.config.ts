import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load test env (separate "test" schema) before anything else runs.
const { parsed = {} } = config({ path: '.env.test', override: true });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    env: parsed,
    // Tests share one database: run files sequentially
    fileParallelism: false,
    testTimeout: 15000, // remote DB latency
    coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/**'] },
  },
});
