/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { MOCK_AGENT, mockApi } from './mocks';

// Three conversations, newest first, held in memory so deletes stick.
function makeThreads() {
  return [
    { id: 't1', name: 'Permits by neighborhood', hoursAgo: 1 },
    { id: 't2', name: 'Inspection backlog', hoursAgo: 30 },
    { id: 't3', name: 'Council memo draft', hoursAgo: 100 },
  ].map((t) => ({
    id: t.id,
    name: t.name,
    agentId: MOCK_AGENT.id,
    createdAt: new Date(Date.now() - t.hoursAgo * 3_600_000).toISOString(),
    runs: [],
  }));
}

// Serve the thread list and record deletes on top of the default mocks.
async function mockHistory(page: Page) {
  await mockApi(page);
  let threads = makeThreads();
  const deleted: string[][] = [];
  await page.route(/^https?:\/\/[^/]+\/api\/threads(\?.*)?$/, async (route) => {
    const request = route.request();
    if (request.method() === 'DELETE') {
      const { ids } = request.postDataJSON() as { ids: string[] };
      deleted.push(ids);
      threads = threads.filter((t) => !ids.includes(t.id));
      return route.fulfill({ status: 204 });
    }
    if (request.method() !== 'GET') {
      return route.fallback();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        pageSize: 100,
        pageNumber: 1,
        pageCount: 1,
        totalCount: threads.length,
        items: threads,
      }),
    });
  });
  return deleted;
}

test.describe('history page', () => {
  test('lists conversations with agent and relative time', async ({ page }) => {
    await mockHistory(page);
    await page.goto('/history');

    const table = page.getByRole('table', { name: 'Conversations' });
    await expect(
      table.getByRole('link', { name: 'Permits by neighborhood' }),
    ).toBeVisible();
    await expect(table.getByText('Test Agent').first()).toBeVisible();
    await expect(table.getByText('1 hour ago')).toBeVisible();
    await expect(page.getByText('3 conversations')).toBeVisible();
  });

  test('searches by name', async ({ page }) => {
    await mockHistory(page);
    await page.goto('/history');

    await page
      .getByRole('searchbox', { name: 'Search conversations' })
      .fill('memo');

    const table = page.getByRole('table', { name: 'Conversations' });
    await expect(
      table.getByRole('link', { name: 'Council memo draft' }),
    ).toBeVisible();
    await expect(
      table.getByRole('link', { name: 'Inspection backlog' }),
    ).toBeHidden();
  });

  test('confirms before deleting a conversation', async ({ page }) => {
    const deleted = await mockHistory(page);
    await page.goto('/history');

    await page
      .getByRole('button', { name: 'Delete Inspection backlog' })
      .click();

    const dialog = page.getByRole('dialog', {
      name: /Delete “Inspection backlog”/,
    });
    await expect(dialog).toBeVisible();

    // Cancelling deletes nothing.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    expect(deleted).toEqual([]);

    // Confirming deletes it and says so.
    await page
      .getByRole('button', { name: 'Delete Inspection backlog' })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete' })
      .click();

    await expect(page.getByText('Deleted 1 conversation')).toBeVisible();
    expect(deleted).toEqual([['t2']]);
    await expect(
      page
        .getByRole('table', { name: 'Conversations' })
        .getByRole('link', { name: 'Inspection backlog' }),
    ).toBeHidden();
  });

  test('bulk deletes selected conversations', async ({ page }) => {
    const deleted = await mockHistory(page);
    await page.goto('/history');

    await page
      .getByRole('checkbox', { name: 'Select Permits by neighborhood' })
      .click();
    await page
      .getByRole('checkbox', { name: 'Select Council memo draft' })
      .click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    const dialog = page.getByRole('dialog', {
      name: 'Delete 2 conversations?',
    });
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Deleted 2 conversations')).toBeVisible();
    expect(deleted[0]?.slice().sort()).toEqual(['t1', 't3']);
  });

  test('has no critical or serious accessibility violations', {
    tag: '@a11y',
  }, async ({ page }) => {
    await mockHistory(page);
    // Skip `motion-safe` entrance animations so axe measures settled colors,
    // not a frame mid-fade.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/history');
    await expect(
      page.getByRole('table', { name: 'Conversations' }),
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
