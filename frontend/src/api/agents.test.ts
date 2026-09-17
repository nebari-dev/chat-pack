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
} from './agents';
import type { AgentConfig } from './app';

const definition: AgentDefinition = {
  name: 'Support Bot',
  description: 'Answers support questions',
  instructions: 'Use {{ tone }} and {% if x %}y{% endif %}',
  model: 'test/model-a',
  mcpUrl: '',
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
          version: 1,
          definition: {
            name: 'Support Bot',
            description: null,
            instructions: 'Be helpful.',
            model: 'test/model-a',
            mcpUrl: 'https://mcp.example.com/mcp',
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
      mcpUrl: '',
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

  it('rejects a malformed MCP url but allows blank', () => {
    expect(
      AgentDefinitionSchema.safeParse({ ...definition, mcpUrl: 'nope' })
        .success,
    ).toBe(false);
    expect(
      AgentDefinitionSchema.safeParse({ ...definition, mcpUrl: '' }).success,
    ).toBe(true);
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
      mcp_url: null,
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
      mcpUrl: 'https://mcp.example.com/mcp',
    });
    expect(body.agent.params.description).toBeNull();
    expect(body.agent.params.mcp_url).toBe(
      '{% raw %}https://mcp.example.com/mcp{% endraw %}',
    );
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
        mcpUrl: 'https://mcp.example.com/mcp',
        quickPrompts: [{ title: 'Hi', description: '', prompt: 'Hello!' }],
      },
      setupError: null,
      createdAt: '2026-09-16T00:00:00+00:00',
    });
  });

  it('ignores metadata of an unknown version', () => {
    const agent: AgentConfig = {
      ...dynamicAgent,
      capabilities: {
        identity: {
          name: 'x',
          metadata: { nebariChat: { kind: 'dynamic', version: 2 } },
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
