/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import {
  ALL_PERMISSIONS,
  MOCK_AGENT,
  MOCK_BROKEN_AGENT,
  MOCK_DYNAMIC_AGENT,
  type MockApiOptions,
  mockApi,
} from './mocks';

const FACTORY = 'ravnar_nebari_chat.dynamic_agents.make_chat_agent';

/**
 * Install mocks for a deployment where authoring is enabled.
 */
function mockAuthoring(page: Page, options: MockApiOptions = {}) {
  return mockApi(page, {
    dynamicAgentsEnabled: true,
    agents: [MOCK_AGENT, MOCK_DYNAMIC_AGENT],
    ...options,
  });
}

/**
 * Assert the page has no critical or serious accessibility violations.
 */
async function expectAccessible(page: Page) {
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
}

test.describe('agents page when dynamic agents are disabled', () => {
  test('is unreachable and offers no entry points', async ({ page }) => {
    await mockApi(page);

    await page.goto('/agents');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

    await expect(
      page.getByRole('link', { name: 'Agents', exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText('New agent')).toHaveCount(0);
  });
});

test.describe('agents page', () => {
  test('lists static and custom agents with the right affordances', async ({
    page,
  }) => {
    await mockAuthoring(page);

    await page.goto('/');
    await page.getByRole('link', { name: 'Agents', exact: true }).click();
    await expect(page).toHaveURL(/\/agents$/);
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible();

    const staticRow = page.getByRole('row', { name: /Test Agent/ });
    await expect(staticRow.getByText('Static', { exact: true })).toBeVisible();
    await expect(staticRow.getByRole('link', { name: /Edit/ })).toHaveCount(0);
    await expect(staticRow.getByRole('button', { name: /Delete/ })).toHaveCount(
      0,
    );

    const customRow = page.getByRole('row', { name: /Custom Agent/ });
    await expect(customRow.getByText('Custom', { exact: true })).toBeVisible();
    await expect(customRow.getByText('test/model-a')).toBeVisible();
    await expect(customRow.getByText('Ready')).toBeVisible();
    await expect(
      customRow.getByRole('link', { name: 'Edit Custom Agent' }),
    ).toBeVisible();
    await expect(
      customRow.getByRole('button', { name: 'Delete Custom Agent' }),
    ).toBeVisible();
  });

  test('flags an agent whose setup failed', async ({ page }) => {
    await mockAuthoring(page, { agents: [MOCK_AGENT, MOCK_BROKEN_AGENT] });

    await page.goto('/agents');
    const row = page.getByRole('row', { name: /Broken Agent/ });
    await expect(row.getByText('Setup failed')).toBeVisible();
  });

  test('creates an agent and lands in a chat with it', async ({ page }) => {
    const mock = await mockAuthoring(page);

    await page.goto('/agents');
    await page.getByRole('link', { name: 'New agent' }).click();
    await expect(page).toHaveURL(/\/agents\?new=true$/);

    const dialog = page.getByRole('dialog', { name: 'New agent' });
    await expect(dialog).toBeVisible();

    // Submitting an empty form validates client-side and sends nothing.
    await dialog.getByRole('button', { name: 'Create agent' }).click();
    await expect(dialog.getByText('Name is required')).toBeVisible();
    await expect(dialog.getByText('Instructions are required')).toBeVisible();
    await expect(dialog.getByText('Model is required')).toBeVisible();
    expect(mock.requests).toHaveLength(0);

    // Fill in the form, including a quick prompt and text with braces that
    // Ravnar would otherwise treat as a template.
    await dialog.getByLabel('Name', { exact: true }).fill('Support Bot');
    await dialog
      .getByLabel('Instructions', { exact: true })
      .fill('Use {{ tone }} politely.');
    await dialog.getByRole('combobox', { name: 'Model' }).click();
    await page.getByRole('option', { name: 'Model B' }).click();
    await dialog.getByRole('button', { name: 'Add quick prompt' }).click();
    const promptRow = dialog.getByRole('group', { name: 'Quick prompt 1' });
    await promptRow.getByLabel('Prompt title').fill('Greet');
    await promptRow.getByLabel('Prompt text').fill('Hello there');
    await dialog.getByRole('button', { name: 'Create agent' }).click();

    // Exactly one registration was sent, targeting the pack factory.
    await expect(page).toHaveURL(/\/chat\?agentId=support-bot-[a-z0-9]{6}$/);
    expect(mock.requests).toHaveLength(1);
    const [request] = mock.requests;
    const body = request.body as {
      id: string;
      agent: { cls_or_fn: string; params: Record<string, unknown> };
    };
    expect(request.method).toBe('POST');
    expect(body.id).toMatch(/^support-bot-[a-z0-9]{6}$/);
    expect(body.agent.cls_or_fn).toBe(FACTORY);
    expect(body.agent.params.model).toBe('{% raw %}test/model-b{% endraw %}');
    expect(body.agent.params.instructions).toBe(
      '{% raw %}Use {{ tone }} politely.{% endraw %}',
    );
    expect(body.agent.params.mcp_url).toBeNull();
    expect(body.agent.params.quick_prompts).toEqual([
      {
        title: '{% raw %}Greet{% endraw %}',
        description: null,
        prompt: '{% raw %}Hello there{% endraw %}',
      },
    ]);

    // The new agent is selected in the chat header.
    await expect(
      page.getByRole('combobox', { name: 'Select agent' }),
    ).toContainText('Support Bot');
  });

  test('edits an agent by re-registering it under the same id', async ({
    page,
  }) => {
    const mock = await mockAuthoring(page);

    await page.goto(`/agents?edit=${MOCK_DYNAMIC_AGENT.id}`);
    const dialog = page.getByRole('dialog', { name: 'Edit agent' });
    await expect(dialog).toBeVisible();

    // The form is prefilled from the agent's metadata.
    await expect(dialog.getByLabel('Name', { exact: true })).toHaveValue(
      'Custom Agent',
    );
    await expect(dialog.getByLabel('Description', { exact: true })).toHaveValue(
      'Answers questions',
    );
    await expect(
      dialog.getByLabel('Instructions', { exact: true }),
    ).toHaveValue('You are helpful.');
    await expect(dialog.getByRole('combobox', { name: 'Model' })).toContainText(
      'Model A',
    );
    await expect(
      dialog
        .getByRole('group', { name: 'Quick prompt 1' })
        .getByLabel('Prompt title'),
    ).toHaveValue('Hi');

    await dialog
      .getByLabel('Instructions', { exact: true })
      .fill('Be concise.');
    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/agents$/);
    expect(mock.requests.map((r) => r.method)).toEqual(['DELETE', 'POST']);
    expect(mock.requests[0].url).toMatch(/\/api\/agents\/custom-agent-abc123$/);
    expect((mock.requests[1].body as { id: string }).id).toBe(
      MOCK_DYNAMIC_AGENT.id,
    );
    expect(
      (mock.requests[1].body as { agent: { params: { instructions: string } } })
        .agent.params.instructions,
    ).toBe('{% raw %}Be concise.{% endraw %}');
  });

  test('restores the previous definition when an edit is rejected', async ({
    page,
  }) => {
    const mock = await mockAuthoring(page);
    mock.failNextCreate = {
      status: 422,
      detail:
        "Model 'test/model-a' is not allowed. Allowed models: test/model-b",
    };

    await page.goto(`/agents?edit=${MOCK_DYNAMIC_AGENT.id}`);
    const dialog = page.getByRole('dialog', { name: 'Edit agent' });
    await dialog
      .getByLabel('Instructions', { exact: true })
      .fill('Rejected edit');
    await dialog.getByRole('button', { name: 'Save changes' }).click();

    // The server's message is surfaced and the form stays open.
    await expect(
      page.getByText("Model 'test/model-a' is not allowed", { exact: false }),
    ).toBeVisible();
    await expect(dialog).toBeVisible();

    // Delete, the rejected create, then the rollback create.
    expect(mock.requests.map((r) => r.method)).toEqual([
      'DELETE',
      'POST',
      'POST',
    ]);
    const rollback = mock.requests[2].body as {
      agent: { params: { instructions: string } };
    };
    expect(rollback.agent.params.instructions).toBe(
      '{% raw %}You are helpful.{% endraw %}',
    );
  });

  test('deletes an agent after confirmation', async ({ page }) => {
    const mock = await mockAuthoring(page);

    await page.goto('/agents');
    await page.getByRole('button', { name: 'Delete Custom Agent' }).click();

    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText(/Chats bound to this agent/)).toBeVisible();

    // Cancelling sends nothing.
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirm).toBeHidden();
    expect(mock.requests).toHaveLength(0);

    // Confirming deletes and refreshes the list.
    await page.getByRole('button', { name: 'Delete Custom Agent' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();

    await expect(page.getByRole('row', { name: /Custom Agent/ })).toHaveCount(
      0,
    );
    expect(mock.requests.map((r) => r.method)).toEqual(['DELETE']);
    expect(mock.requests[0].url).toMatch(/\/api\/agents\/custom-agent-abc123$/);
  });

  test('hides authoring controls without the write permission', async ({
    page,
  }) => {
    await mockAuthoring(page, {
      permissions: ALL_PERMISSIONS.filter((p) => p !== 'agents:write'),
    });

    await page.goto('/agents');
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New agent' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Edit / })).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Delete Custom Agent' }),
    ).toBeVisible();
  });

  test('hides the delete control without the delete permission', async ({
    page,
  }) => {
    await mockAuthoring(page, {
      permissions: ALL_PERMISSIONS.filter((p) => p !== 'agents:delete'),
    });

    await page.goto('/agents');
    await expect(
      page.getByRole('link', { name: 'Edit Custom Agent' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Delete / })).toHaveCount(0);
  });

  test('disables creation when no models are configured', async ({ page }) => {
    await mockAuthoring(page, { authoringModels: [] });

    await page.goto('/agents');
    await expect(page.getByText('No models configured')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'New agent' }),
    ).toBeDisabled();
  });

  test('only offers the MCP field when enabled', async ({ page }) => {
    await mockAuthoring(page, { mcpEnabled: false });
    await page.goto('/agents?new=true');
    await expect(page.getByLabel('MCP server URL')).toHaveCount(0);

    await mockAuthoring(page, { mcpEnabled: true });
    await page.goto('/agents?new=true');
    await expect(page.getByLabel('MCP server URL')).toBeVisible();
  });

  test('has no critical or serious accessibility violations', {
    tag: '@a11y',
  }, async ({ page }) => {
    await mockAuthoring(page, { mcpEnabled: true });

    await page.goto('/agents');
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible();
    await expectAccessible(page);

    await page.goto('/agents?new=true');
    const dialog = page.getByRole('dialog', { name: 'New agent' });
    await expect(dialog).toBeVisible();
    // Let the entrance animation settle so axe measures the final colors.
    await expect(dialog).toHaveCSS('opacity', '1');
    await expectAccessible(page);
  });
});

test.describe('home page with dynamic agents', () => {
  test('offers a New agent card and labels custom agents', async ({ page }) => {
    await mockAuthoring(page);

    await page.goto('/');
    await expect(page.getByText('Custom', { exact: true })).toBeVisible();
    await page
      .getByText('Create a custom agent with its own instructions')
      .click();
    await expect(page).toHaveURL(/\/agents\?new=true$/);
  });
});
