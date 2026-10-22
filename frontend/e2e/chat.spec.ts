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
    await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();

    // Composer controls are present.
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Attach file' }),
    ).toBeVisible();
  });

  test('introduces the agent and its quick prompts on a new chat', async ({
    page,
  }) => {
    await page.goto('/chat?agentId=test-agent');

    const intro = page.getByRole('region', {
      name: 'New chat with Test Agent',
    });
    await expect(
      intro.getByRole('heading', { name: 'Test Agent' }),
    ).toBeVisible();
    await expect(
      intro.getByRole('button', { name: /Say hello/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Message' }),
    ).toHaveAttribute('placeholder', 'Message Test Agent…');
  });

  test('sends a quick prompt as the first message', async ({ page }) => {
    // Capture the created thread's name, which is taken from the prompt.
    let createdName: string | undefined;
    await page.route(/^https?:\/\/[^/]+\/api\/threads$/, (route) => {
      if (route.request().method() !== 'POST') {
        return route.fallback();
      }
      createdName = route.request().postDataJSON()?.name;
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
    await page.route(
      /^https?:\/\/[^/]+\/api\/threads\/[^/]+\/runs$/,
      () => new Promise<void>(() => {}),
    );

    await page.goto('/chat?agentId=test-agent');
    await page.getByRole('button', { name: /Say hello/ }).click();

    await expect(page).toHaveURL(/threadId=thread-1/);
    expect(createdName).toBe('Hello!');
  });

  test('has no critical or serious accessibility violations', {
    tag: '@a11y',
  }, async ({ page }) => {
    // Skip `motion-safe` entrance animations so axe measures settled colors,
    // not a frame mid-fade.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/chat?agentId=test-agent');
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
    const composer = page.getByRole('textbox', { name: 'Message' });
    await composer.fill('Do something slow');
    await page.getByRole('button', { name: 'Send' }).click();

    // While the run is in-flight the Submit button is replaced by Stop.
    const stop = page.getByRole('button', { name: 'Stop' });
    await expect(stop).toBeVisible();

    // Cancelling the run aborts the stream and restores the composer.
    await stop.click();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await expect(composer).toBeEnabled();
  });
});
