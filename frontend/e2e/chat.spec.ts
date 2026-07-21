/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { mockApi } from './mocks';

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
});
