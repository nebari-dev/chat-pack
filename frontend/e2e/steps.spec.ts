/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { MOCK_AGENT, mockApi } from './mocks';

/**
 * A finished thread whose reply reasoned, called one tool, and answered.
 */
const THREAD = {
  id: 'thread-1',
  name: 'Permits by neighborhood',
  agentId: MOCK_AGENT.id,
  createdAt: '2025-01-01T00:00:00.000Z',
  runs: [],
};

const MESSAGES = [
  { id: 'm1', role: 'user', content: 'Which neighborhood had the most?' },
  { id: 'm2', role: 'reasoning', content: 'Group permits by neighborhood.' },
  {
    id: 'm3',
    role: 'assistant',
    content: 'East Riverside had the most permits.',
    toolCalls: [
      {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'query_database',
          arguments: '{"sql":"SELECT 1"}',
        },
      },
    ],
  },
  {
    id: 'm4',
    role: 'tool',
    toolCallId: 'call-1',
    content: '[{"neighborhood":"East Riverside","n":1284}]',
  },
];

// Serve the thread and its messages on top of the default mocks.
async function mockThread(page: Page) {
  await mockApi(page);
  const json = (body: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
  await page.route(/^https?:\/\/[^/]+\/api\/threads\/thread-1$/, (route) =>
    route.fulfill(json(THREAD)),
  );
  await page.route(
    /^https?:\/\/[^/]+\/api\/threads\/thread-1\/messages$/,
    (route) => route.fulfill(json(MESSAGES)),
  );
}

test.beforeEach(async ({ page }) => {
  await mockThread(page);
});

test.describe('reply steps', () => {
  test('shows reasoning and tool calls inline', async ({ page }) => {
    await page.goto('/chat?threadId=thread-1');

    await expect(
      page.getByRole('heading', { name: 'Permits by neighborhood' }),
    ).toBeVisible();
    await expect(
      page.getByText('East Riverside had the most permits.'),
    ).toBeVisible();

    // Reasoning starts collapsed and expands in place.
    const reasoning = page.getByRole('button', { name: 'Reasoning' });
    await expect(page.getByText('Group permits by neighborhood.')).toBeHidden();
    await reasoning.click();
    await expect(
      page.getByText('Group permits by neighborhood.'),
    ).toBeVisible();

    // Tool calls start expanded, one row per call.
    await expect(
      page.getByRole('button', { name: 'Used 1 tool' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /query_database/ }),
    ).toBeVisible();
  });

  test('opens a tool call in the detail drawer', async ({ page }) => {
    await page.goto('/chat?threadId=thread-1');

    await page.getByRole('link', { name: /query_database/ }).click();

    await expect(page).toHaveURL(/detailId=m3/);
    const drawer = page.getByRole('dialog', { name: 'Tool calls' });
    await expect(drawer).toBeVisible();
    await expect(
      drawer.getByRole('region', { name: 'Tool call query_database' }),
    ).toBeVisible();
    await expect(drawer.getByText('"East Riverside"')).toBeVisible();

    // Closing the drawer clears the param.
    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(page).not.toHaveURL(/detailId/);
  });

  test('restores the drawer from a link', async ({ page }) => {
    await page.goto('/chat?threadId=thread-1&detailId=m3');

    await expect(
      page.getByRole('dialog', { name: 'Tool calls' }),
    ).toBeVisible();
  });

  test('has no critical or serious accessibility violations', {
    tag: '@a11y',
  }, async ({ page }) => {
    // Skip `motion-safe` entrance animations so axe measures settled colors,
    // not a frame mid-fade.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/chat?threadId=thread-1&detailId=m3');
    await expect(
      page.getByRole('dialog', { name: 'Tool calls' }),
    ).toBeVisible();

    // Base UI wraps open popups in invisible focus-guard spans. On WebKit it
    // gives them `role="button"` for VoiceOver, which axe reports as unnamed
    // buttons. They are library internals, not app markup, so skip them.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('[data-base-ui-focus-guard]')
      .analyze();

    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(
      seriousViolations,
      `Accessibility violations:\n${JSON.stringify(seriousViolations, null, 2)}`,
    ).toEqual([]);
  });
});
