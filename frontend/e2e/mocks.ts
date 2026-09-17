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
 * The key under which the backend factory stashes an authored definition.
 */
const METADATA_KEY = 'nebariChat';

/**
 * Build a dynamic (user-authored) agent as the backend would advertise it.
 */
export function mockDynamicAgent(options: {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string;
  model?: string;
  tools?: string[];
  mcpServers?: ({ server: string } | { url: string })[];
  dataSources?: { database: string }[];
  setupError?: string | null;
  quickPrompts?: { title: string; description?: string; prompt: string }[];
}) {
  const {
    id,
    name,
    description = null,
    instructions = 'You are helpful.',
    model = 'test/model-a',
    tools = [],
    mcpServers = [],
    dataSources = [],
    setupError = null,
    quickPrompts = [],
  } = options;
  return {
    id,
    capabilities: {
      identity: {
        name,
        ...(description === null ? {} : { description }),
        type: 'pydantic-ai',
        provider: 'nebari-chat',
        metadata: {
          [METADATA_KEY]: {
            kind: 'dynamic',
            version: 2,
            definition: {
              name,
              description,
              instructions,
              model,
              tools,
              mcpServers,
              dataSources,
            },
            setupError,
            createdAt: '2026-01-01T00:00:00+00:00',
          },
        },
      },
      tools: { supported: true, clientProvided: true, items: [] },
    },
    quickPrompts,
  };
}

/**
 * A user-authored agent the mocked backend advertises when asked to.
 */
export const MOCK_DYNAMIC_AGENT = mockDynamicAgent({
  id: 'custom-agent-abc123',
  name: 'Custom Agent',
  description: 'Answers questions',
  tools: ['charts'],
  mcpServers: [{ server: 'frames' }],
  quickPrompts: [{ title: 'Hi', prompt: 'Hello' }],
});

/**
 * A user-authored agent whose tool discovery failed on the backend.
 */
export const MOCK_BROKEN_AGENT = mockDynamicAgent({
  id: 'broken-agent-def456',
  name: 'Broken Agent',
  mcpServers: [{ url: 'https://mcp.example.com/mcp' }],
  setupError: 'ConnectionError: refused',
});

/**
 * The models the mocked runtime config offers for authoring.
 */
export const MOCK_MODELS = [
  { id: 'test/model-a', label: 'Model A' },
  { id: 'test/model-b', label: 'Model B' },
];

/**
 * The catalog the mocked runtime config offers for authoring.
 */
export const MOCK_CATALOG = {
  tools: [
    { id: 'charts', label: 'Charts and maps', kind: 'visualization' },
    {
      id: 'permits',
      label: 'Austin permits',
      kind: 'sql',
      description: 'Building permits, read-only',
    },
  ],
  mcpServers: [
    { id: 'frames', label: 'Frames', auth: 'none' },
    { id: 'secure', label: 'Secure', auth: 'impersonate' },
  ],
  databases: [{ id: 'permits', label: 'Austin permits' }],
};

/**
 * The permissions the mocked user holds by default: everything the app
 * requires to render, plus the two agent authoring permissions.
 */
export const ALL_PERMISSIONS = [
  'threads:read',
  'threads:write',
  'threads:delete',
  'agents:read',
  'agents:write',
  'agents:delete',
];

/**
 * The user the mocked backend authenticates, holding every permission the
 * `_authenticated` route requires so the app renders past its guards.
 */
export const MOCK_USER = {
  id: 'test-user',
  permissions: ALL_PERMISSIONS,
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
 * Options for `mockApi`. Defaults reproduce a deployment without agent
 * authoring, which is what the pre-existing specs expect.
 */
export type MockApiOptions = {
  /**
   * Whether the backend reports dynamic agents as enabled.
   */
  dynamicAgentsEnabled?: boolean;

  /**
   * The agents the backend initially advertises.
   */
  agents?: unknown[];

  /**
   * The permissions the mocked user holds.
   */
  permissions?: string[];

  /**
   * The models the runtime config offers for authoring.
   */
  authoringModels?: { id: string; label?: string }[];

  /**
   * Whether the runtime config allows custom MCP server URLs.
   */
  mcpEnabled?: boolean;

  /**
   * The catalog the runtime config offers. Defaults to `MOCK_CATALOG`; pass
   * `null` for an empty catalog.
   */
  catalog?: typeof MOCK_CATALOG | null;
};

/**
 * A recorded write request against the agents API.
 */
export type RecordedRequest = {
  method: string;
  url: string;
  body: unknown;
};

/**
 * The handle returned by `mockApi` for inspecting and steering the mock.
 */
export type MockApi = {
  /**
   * Every POST/DELETE against `/api/agents`, in order.
   */
  readonly requests: RecordedRequest[];

  /**
   * The agents currently advertised by the mock (mutated by POST/DELETE).
   */
  readonly agents: unknown[];

  /**
   * When set, the next `POST /api/agents` fails with this response and the
   * field is cleared.
   */
  failNextCreate: { status: number; detail: string } | null;
};

/**
 * Strip the Jinja raw block the frontend wraps user text in.
 */
function unwrapRaw(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  return value.replace(/^\{% raw %\}/, '').replace(/\{% endraw %\}$/, '');
}

/**
 * Install route mocks for every backend endpoint the app calls on startup.
 *
 * With auth disabled (`VITE_AUTH_ENABLED=false`) and these mocks in place, the app boots and
 * renders the authenticated home page without a Ravnar backend or Keycloak.
 * Call this before navigating.
 */
export async function mockApi(
  page: Page,
  options: MockApiOptions = {},
): Promise<MockApi> {
  const json = (body: unknown, status = 200) => ({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

  const handle: MockApi = {
    requests: [],
    agents: [...(options.agents ?? [MOCK_AGENT])],
    failNextCreate: null,
  };

  // The runtime config the SPA loads before React mounts. Auth is disabled,
  // so no `keycloak` block is needed.
  await page.route(/^https?:\/\/[^/]+\/config\.json$/, (route) =>
    route.fulfill(
      json({
        agentAuthoring: {
          models: options.authoringModels ?? MOCK_MODELS,
          mcp: { enabled: options.mcpEnabled ?? false },
          ...(options.catalog === null
            ? {}
            : (options.catalog ?? MOCK_CATALOG)),
        },
      }),
    ),
  );

  // Anchor patterns to the server root (`http(s)://host/api/...`). A loose
  // glob like `**/api/threads*` would also match the app's own source module
  // `/src/api/threads.ts` in Vite dev and replace it with JSON, breaking the
  // bundle — so match the origin explicitly.
  await page.route(/^https?:\/\/[^/]+\/api\/config$/, (route) =>
    route.fulfill(
      json({
        storageEnabled: true,
        dynamicAgentsEnabled: options.dynamicAgentsEnabled ?? false,
      }),
    ),
  );

  // The agents collection: GET lists, POST registers (echoing the authored
  // definition back the way the backend factory would).
  await page.route(/^https?:\/\/[^/]+\/api\/agents$/, (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      return route.fulfill(json(handle.agents));
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as {
        id: string;
        agent: { params: Record<string, unknown> };
      };
      handle.requests.push({ method: 'POST', url: request.url(), body });
      if (handle.failNextCreate) {
        const { status, detail } = handle.failNextCreate;
        handle.failNextCreate = null;
        return route.fulfill(json({ detail }, status));
      }
      const params = body.agent.params;
      const prompts = (params.quick_prompts as Record<string, unknown>[]) ?? [];
      const servers = (params.mcp_servers as Record<string, unknown>[]) ?? [];
      const sources = (params.data_sources as Record<string, unknown>[]) ?? [];
      const agent = mockDynamicAgent({
        id: body.id,
        name: unwrapRaw(params.name) ?? body.id,
        description: unwrapRaw(params.description),
        instructions: unwrapRaw(params.instructions) ?? '',
        model: unwrapRaw(params.model) ?? '',
        tools: ((params.tools as unknown[]) ?? []).map(
          (t) => unwrapRaw(t) ?? '',
        ),
        mcpServers: servers.map((srv) =>
          typeof srv.server === 'string'
            ? { server: unwrapRaw(srv.server) ?? '' }
            : { url: unwrapRaw(srv.url) ?? '' },
        ),
        dataSources: sources.map((src) => ({
          database: unwrapRaw(src.database) ?? '',
        })),
        quickPrompts: prompts.map((p) => ({
          title: unwrapRaw(p.title) ?? '',
          description: unwrapRaw(p.description) ?? undefined,
          prompt: unwrapRaw(p.prompt) ?? '',
        })),
      });
      handle.agents.push(agent);
      return route.fulfill(json(agent));
    }
    return route.fallback();
  });

  // A single agent: DELETE unregisters it.
  await page.route(/^https?:\/\/[^/]+\/api\/agents\/[^/]+$/, (route) => {
    const request = route.request();
    if (request.method() !== 'DELETE') {
      return route.fallback();
    }
    const id = decodeURIComponent(request.url().split('/').pop() ?? '');
    handle.requests.push({ method: 'DELETE', url: request.url(), body: null });
    const index = handle.agents.findIndex(
      (a) => (a as { id: string }).id === id,
    );
    if (index === -1) {
      return route.fulfill(json({ detail: 'Agent not found' }, 404));
    }
    handle.agents.splice(index, 1);
    return route.fulfill(json(null));
  });

  await page.route(/^https?:\/\/[^/]+\/api\/user$/, (route) =>
    route.fulfill(
      json({
        ...MOCK_USER,
        permissions: options.permissions ?? MOCK_USER.permissions,
      }),
    ),
  );
  await page.route(/^https?:\/\/[^/]+\/api\/threads(\?.*)?$/, (route) =>
    route.fulfill(json(EMPTY_THREAD_PAGE)),
  );

  return handle;
}
