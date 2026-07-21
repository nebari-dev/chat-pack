/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { Page } from '@playwright/test';

/**
 * The agent the mocked backend advertises.
 *
 * Shaped to satisfy `AgentConfigSchema` (see `src/api/app.ts`); every
 * `capabilities` field is optional, so only `identity.name` is set — that is
 * what the home page renders as the agent card title.
 */
export const MOCK_AGENT = {
  id: 'test-agent',
  capabilities: { identity: { name: 'Test Agent' } },
  quickPrompts: [
    {
      title: 'Say hello',
      description: 'A friendly greeting',
      prompt: 'Hello!',
    },
  ],
};

/**
 * The user the mocked backend authenticates, holding every permission the
 * `_authenticated` route requires so the app renders past its guards.
 */
export const MOCK_USER = {
  id: 'test-user',
  permissions: [
    'threads:read',
    'threads:write',
    'threads:delete',
    'agents:read',
  ],
  data: { name: 'Test User' },
};

/**
 * An empty, well-formed thread page (see `createPageSchema`), so the sidebar's
 * recent-threads query resolves cleanly with no history.
 */
export const EMPTY_THREAD_PAGE = {
  pageSize: 20,
  pageNumber: 1,
  pageCount: 0,
  totalCount: 0,
  items: [],
};

/**
 * Install route mocks for every backend endpoint the app calls on startup.
 *
 * With auth disabled (`VITE_AUTH_ENABLED=false`) and these mocks in place, the app boots and
 * renders the authenticated home page without a Ravnar backend or Keycloak.
 * Call this before navigating.
 */
export async function mockApi(page: Page): Promise<void> {
  const json = (body: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

  // Anchor patterns to the server root (`http(s)://host/api/...`). A loose
  // glob like `**/api/threads*` would also match the app's own source module
  // `/src/api/threads.ts` in Vite dev and replace it with JSON, breaking the
  // bundle — so match the origin explicitly.
  await page.route(/^https?:\/\/[^/]+\/api\/config$/, (route) =>
    route.fulfill(json({ storageEnabled: true, dynamicAgentsEnabled: false })),
  );
  await page.route(/^https?:\/\/[^/]+\/api\/agents$/, (route) =>
    route.fulfill(json([MOCK_AGENT])),
  );
  await page.route(/^https?:\/\/[^/]+\/api\/user$/, (route) =>
    route.fulfill(json(MOCK_USER)),
  );
  await page.route(/^https?:\/\/[^/]+\/api\/threads(\?.*)?$/, (route) =>
    route.fulfill(json(EMPTY_THREAD_PAGE)),
  );
}
