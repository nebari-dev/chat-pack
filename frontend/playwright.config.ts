/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { defineConfig, devices } from '@playwright/test';

// The dev-server port used by the e2e suite. `--strictPort` makes Vite fail
// rather than silently pick another port, keeping `baseURL` in sync.
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

// Whether we are running in CI. In CI we forbid `test.only`, retry flaky
// specs, and always start a fresh dev server.
const isCI = !!process.env.CI;

/**
 * Playwright end-to-end configuration.
 *
 * The suite boots the app via Vite with `VITE_AUTH_ENABLED=false` (injected
 * into the dev server below), which disables authentication. Every `/api/*`
 * request is intercepted with route mocks inside the specs, so the suite runs
 * without a backend or Keycloak.
 *
 * Accessibility assertions (`@axe-core/playwright`) run inline within the e2e
 * specs, so `test:e2e` also covers `test:a11y`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    // Disable Keycloak auth for the run. Vite injects `VITE_`-prefixed
    // process env vars into `import.meta.env`, overriding the value in `.env`.
    env: { VITE_AUTH_ENABLED: 'false' },
  },
});
