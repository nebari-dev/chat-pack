/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { MOCK_AGENT, mockApi } from './mocks';

// Install the API mocks before every navigation so the app boots without a
// backend (auth is disabled via the Playwright web server's env). A brand-new
// chat has no thread or messages, so the mocked agents endpoint is all the
// empty chat view needs to render.
test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe('chat page', () => {
  test('renders the empty chat view for an agent', async ({ page }) => {
    await page.goto('/chat?agentId=test-agent');

    // The message composer is the anchor of the chat view.
    await expect(page.getByPlaceholder('Send a message...')).toBeVisible();

    // Composer controls are present.
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Attach File' }),
    ).toBeVisible();
  });

  test('has no critical or serious accessibility violations', {
    tag: '@a11y',
  }, async ({ page }) => {
    await page.goto('/chat?agentId=test-agent');
    await expect(page.getByPlaceholder('Send a message...')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(
      seriousViolations,
      `Accessibility violations:\n${JSON.stringify(seriousViolations, null, 2)}`,
    ).toEqual([]);
  });

  test('offers a Stop button that cancels an in-flight run', async ({
    page,
  }) => {
    // Mock thread creation so submitting a prompt yields a thread whose run
    // can be driven. The optimistic caches populated on success let the chat
    // route load the new thread without further network calls.
    await page.route(/^https?:\/\/[^/]+\/api\/threads$/, (route) => {
      if (route.request().method() !== 'POST') {
        return route.fallback();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'thread-1',
          agentId: MOCK_AGENT.id,
          createdAt: '2025-01-01T00:00:00.000Z',
          runs: [],
        }),
      });
    });

    // Hold the run's event stream open indefinitely to simulate a slow or
    // stalled run. The request never resolves, so the composer stays in its
    // submitting state until the run is cancelled.
    await page.route(
      /^https?:\/\/[^/]+\/api\/threads\/[^/]+\/runs$/,
      () => new Promise<void>(() => {}),
    );

    await page.goto('/chat?agentId=test-agent');

    // Send a prompt to start a run.
    const composer = page.getByPlaceholder('Send a message...');
    await composer.fill('Do something slow');
    await page.getByRole('button', { name: 'Submit' }).click();

    // While the run is in-flight the Submit button is replaced by Stop.
    const stop = page.getByRole('button', { name: 'Stop' });
    await expect(stop).toBeVisible();

    // Cancelling the run aborts the stream and restores the composer.
    await stop.click();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    await expect(composer).toBeEnabled();
  });
});
