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

test.describe('app shell', () => {
  test('opens a new chat at the root', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/chat\?agentId=test-agent/);
    await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();
  });

  test('renders the header and the sidebar navigation', async ({ page }) => {
    await page.goto('/');

    // The header holds the brand link and the account menu, and no nav links.
    const header = page.getByRole('banner');
    await expect(
      header.getByRole('link', { name: 'Go to homepage' }),
    ).toBeVisible();
    await expect(
      header.getByRole('button', { name: 'Account menu' }),
    ).toBeVisible();

    // The sidebar lists the primary action, the agents, and the history link.
    const sidebar = page.getByRole('navigation', { name: 'Conversations' });
    await expect(sidebar.getByRole('link', { name: 'New chat' })).toBeVisible();
    await expect(
      sidebar.getByRole('link', { name: /Test Agent/ }),
    ).toBeVisible();
    await expect(
      sidebar.getByText('Your conversations will appear here.'),
    ).toBeVisible();
    await expect(
      sidebar.getByRole('link', { name: 'All conversations' }),
    ).toBeVisible();
  });

  test('navigates to history from the sidebar', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'All conversations' }).click();

    await expect(page).toHaveURL(/\/history/);
  });

  test('collapses and expands the sidebar', async ({ page }) => {
    // Skip the width transition so positions are measured at rest.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    const expand = page.getByRole('button', { name: 'Expand sidebar' });
    await expect(expand).toHaveAttribute('aria-expanded', 'false');

    // Every icon in the collapsed rail sits on the rail's center line.
    const sidebar = page.getByRole('navigation', { name: 'Conversations' });
    await expect(
      sidebar.getByRole('link', { name: 'All conversations' }),
    ).toBeVisible();
    const rail = (await sidebar.boundingBox())!;
    const railCenter = rail.x + rail.width / 2;
    const icons = [
      sidebar.getByRole('link', { name: 'New chat' }).locator('svg'),
      sidebar
        .getByRole('link', { name: /Test Agent/ })
        .locator('[data-slot=avatar]'),
      sidebar.getByRole('link', { name: 'All conversations' }).locator('svg'),
      expand.locator('svg'),
    ];
    for (const icon of icons) {
      const box = (await icon.boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - railCenter)).toBeLessThan(1);
    }

    await expand.click();
    await expect(
      page.getByRole('button', { name: 'Collapse sidebar' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test('shows the user and sign out in the account menu', async ({ page }) => {
    await page.goto('/');

    // With auth disabled the name comes from the backend's /api/user.
    const trigger = page.getByRole('button', { name: 'Account menu' });
    await expect(trigger).toContainText('Test User');
    await trigger.click();

    await expect(page.getByRole('menu').getByText('Test User')).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Sign out' }),
    ).toBeVisible();
  });

  test('switches theme from the account menu', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Account menu' }).click();

    const dark = page.getByRole('menuitemradio', { name: 'Dark mode' });
    await expect(page.getByRole('menuitemradio')).toHaveCount(3);
    await dark.click();

    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('has no critical or serious accessibility violations', {
    tag: '@a11y',
  }, async ({ page }) => {
    // Skip `motion-safe` entrance animations so axe measures settled colors,
    // not a frame mid-fade.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();

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
