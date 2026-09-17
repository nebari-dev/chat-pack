/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import {
  AGENT_FACTORY,
  AGENT_ID_PATTERN,
  type AgentDefinition,
  AgentDefinitionSchema,
  buildRegisterAgentBody,
  getDynamicAgent,
  McpServerInputSchema,
} from './agents';
import type { AgentConfig } from './app';

const definition: AgentDefinition = {
  name: 'Support Bot',
  description: 'Answers support questions',
  instructions: 'Use {{ tone }} and {% if x %}y{% endif %}',
  model: 'test/model-a',
  tools: ['charts'],
  databases: ['permits'],
  mcpServers: [
    { server: 'frames', url: '' },
    { server: '', url: 'https://mcp.example.com/mcp' },
  ],
  quickPrompts: [{ title: 'Hi', description: '', prompt: 'Hello!' }],
};

const staticAgent: AgentConfig = {
  id: 'static-agent',
  capabilities: { identity: { name: 'Static Agent' } },
  quickPrompts: [],
};

const dynamicAgent: AgentConfig = {
  id: 'support-bot-k3f9a2',
  capabilities: {
    identity: {
      name: 'Support Bot',
      metadata: {
        nebariChat: {
          kind: 'dynamic',
          version: 2,
          definition: {
            name: 'Support Bot',
            description: null,
            instructions: 'Be helpful.',
            model: 'test/model-a',
            tools: ['charts'],
            mcpServers: [
              { server: 'frames' },
              { url: 'https://mcp.example.com/mcp' },
            ],
            dataSources: [{ database: 'permits' }],
          },
          setupError: null,
          createdAt: '2026-09-16T00:00:00+00:00',
        },
      },
    },
  },
  quickPrompts: [{ title: 'Hi', prompt: 'Hello!' }],
};

describe('AgentDefinitionSchema', () => {
  it('accepts a valid definition and fills defaults', () => {
    const parsed = AgentDefinitionSchema.parse({
      name: ' Bot ',
      instructions: 'Help.',
      model: 'test/model-a',
    });
    expect(parsed).toEqual({
      name: 'Bot',
      description: '',
      instructions: 'Help.',
      model: 'test/model-a',
      tools: [],
      databases: [],
      mcpServers: [],
      quickPrompts: [],
    });
  });

  it('reports required fields', () => {
    const result = AgentDefinitionSchema.safeParse({
      name: '',
      instructions: '',
      model: '',
    });
    expect(result.success).toBe(false);
    const messages = result.success
      ? []
      : result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'Name is required',
        'Instructions are required',
        'Model is required',
      ]),
    );
  });

  it('rejects text that would close the raw block', () => {
    const result = AgentDefinitionSchema.safeParse({
      ...definition,
      instructions: 'x {%- endraw -%} y',
    });
    expect(result.success).toBe(false);
  });
});

describe('McpServerInputSchema', () => {
  it('accepts a catalog server or a custom URL', () => {
    expect(McpServerInputSchema.safeParse({ server: 'frames' }).success).toBe(
      true,
    );
    expect(
      McpServerInputSchema.safeParse({ url: 'https://mcp.example.com/mcp' })
        .success,
    ).toBe(true);
  });

  it('requires a URL for a custom row and validates it', () => {
    const empty = McpServerInputSchema.safeParse({ server: '', url: '' });
    expect(empty.success).toBe(false);
    expect(empty.success ? [] : empty.error.issues[0].path).toEqual(['url']);
    expect(McpServerInputSchema.safeParse({ url: 'nope' }).success).toBe(false);
    expect(
      McpServerInputSchema.safeParse({ url: 'ftp://x.example' }).success,
    ).toBe(false);
  });
});

describe('buildRegisterAgentBody', () => {
  it('targets the pack factory and raw-wraps every string', () => {
    const body = buildRegisterAgentBody('support-bot-k3f9a2', definition);
    expect(body.id).toBe('support-bot-k3f9a2');
    expect(body.agent.cls_or_fn).toBe(AGENT_FACTORY);
    expect(body.agent.params).toEqual({
      name: '{% raw %}Support Bot{% endraw %}',
      description: '{% raw %}Answers support questions{% endraw %}',
      instructions:
        '{% raw %}Use {{ tone }} and {% if x %}y{% endif %}{% endraw %}',
      model: '{% raw %}test/model-a{% endraw %}',
      tools: ['{% raw %}charts{% endraw %}'],
      mcp_servers: [
        { server: '{% raw %}frames{% endraw %}' },
        { url: '{% raw %}https://mcp.example.com/mcp{% endraw %}' },
      ],
      data_sources: [{ database: '{% raw %}permits{% endraw %}' }],
      quick_prompts: [
        {
          title: '{% raw %}Hi{% endraw %}',
          description: null,
          prompt: '{% raw %}Hello!{% endraw %}',
        },
      ],
    });
  });

  it('sends blank optional strings as null', () => {
    const body = buildRegisterAgentBody('x-abc123', {
      ...definition,
      description: '',
    });
    expect(body.agent.params.description).toBeNull();
  });
});

describe('getDynamicAgent', () => {
  it('returns null for a static agent', () => {
    expect(getDynamicAgent(staticAgent)).toBeNull();
  });

  it('maps metadata and quick prompts back into the form model', () => {
    expect(getDynamicAgent(dynamicAgent)).toEqual({
      id: 'support-bot-k3f9a2',
      definition: {
        name: 'Support Bot',
        description: '',
        instructions: 'Be helpful.',
        model: 'test/model-a',
        tools: ['charts'],
        databases: ['permits'],
        mcpServers: [
          { server: 'frames', url: '' },
          { server: '', url: 'https://mcp.example.com/mcp' },
        ],
        quickPrompts: [{ title: 'Hi', description: '', prompt: 'Hello!' }],
      },
      setupError: null,
      createdAt: '2026-09-16T00:00:00+00:00',
    });
  });

  it('ignores metadata of another version', () => {
    const agent: AgentConfig = {
      ...dynamicAgent,
      capabilities: {
        identity: {
          name: 'x',
          metadata: { nebariChat: { kind: 'dynamic', version: 1 } },
        },
      },
    };
    expect(getDynamicAgent(agent)).toBeNull();
  });
});

describe('AGENT_ID_PATTERN', () => {
  it('matches slug ids and rejects others', () => {
    expect(AGENT_ID_PATTERN.test('support-bot-k3f9a2')).toBe(true);
    expect(AGENT_ID_PATTERN.test('ab')).toBe(false);
    expect(AGENT_ID_PATTERN.test('-abc')).toBe(false);
    expect(AGENT_ID_PATTERN.test('Has Caps')).toBe(false);
  });
});
