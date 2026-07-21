/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { mockApi } from './mocks';

// Install the API mocks before every navigation so the app boots without a
// backend (auth is disabled via the Playwright web server's env).
test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe('home page', () => {
  test('renders the welcome view and its navigation cards', async ({
    page,
  }) => {
    await page.goto('/');

    // The authenticated shell has loaded past its config/permission guards.
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

    // The static explorer links are present.
    await expect(page.getByText('Chat with agents')).toBeVisible();
    await expect(page.getByText('View and manage agent history')).toBeVisible();

    // The mocked agent is surfaced as a card.
    await expect(page.getByText('Test Agent', { exact: true })).toBeVisible();
  });

  test('navigates into the chat view from an agent card', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Create a new chat with Test Agent').click();

    await expect(page).toHaveURL(/\/chat/);
  });

  test('has no critical or serious accessibility violations', {
    tag: '@a11y',
  }, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

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
