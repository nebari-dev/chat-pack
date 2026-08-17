/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Vitest config for minimal unit coverage of pure functions/utilities.
//
// End-to-end behavior is covered by Playwright (see `playwright.config.ts`);
// unit tests here are intentionally scoped to pure logic co-located in `src`
// as `*.test.ts` files. The Playwright `e2e/` specs are excluded so the two
// runners never overlap.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
