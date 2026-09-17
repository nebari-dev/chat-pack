/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as z from 'zod';
import * as auth from '@/auth';

import { type AgentConfig, AgentConfigSchema, type QuickPrompt } from './app';

/**
 * The only backend factory the UI registers agents through.
 *
 * Ravnar's `POST /api/agents` accepts an arbitrary import path; the UI
 * deliberately targets this single pack-owned factory, which validates a
 * small domain schema server-side and never accepts secrets from the client.
 */
export const AGENT_FACTORY =
  'ravnar_nebari_chat.dynamic_agents.make_chat_agent';

/**
 * The pattern a client-generated agent id must satisfy.
 */
export const AGENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,62}$/;

// Ravnar renders every string in the registration payload as a Jinja
// template. User text is wrapped in a raw block so braces survive verbatim,
// which means the text itself may not contain the closing tag.
const END_RAW = /\{%-?\s*endraw\s*-?%\}/i;

/**
 * Refine a string so it can be safely wrapped in a Jinja raw block.
 */
const templateSafe = <T extends z.ZodString>(schema: T) =>
  schema.refine((value) => !END_RAW.test(value), {
    message: "Text may not contain '{% endraw %}'",
  });

/**
 * Whether a string parses as an http(s) URL.
 */
const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * The schema for a quick prompt as entered in the authoring form.
 */
export const QuickPromptInputSchema = z.object({
  title: templateSafe(z.string().trim().min(1, 'Title is required').max(120)),
  description: templateSafe(z.string().trim().max(300)).default(''),
  prompt: templateSafe(
    z.string().trim().min(1, 'Prompt is required').max(4000),
  ),
});

/**
 * A type alias for a quick prompt input.
 */
export type QuickPromptInput = z.infer<typeof QuickPromptInputSchema>;

/**
 * The schema for an MCP server row as entered in the authoring form.
 *
 * Exactly one of `server` (a catalog key) or `url` (a custom endpoint, where
 * the deployment allows it) is set; a blank `server` means "custom URL".
 */
export const McpServerInputSchema = z
  .object({
    server: z.string().trim().max(63).default(''),
    url: templateSafe(z.string().trim().max(2000)).default(''),
  })
  .superRefine((value, ctx) => {
    if (value.server === '' && value.url === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'Enter the MCP server URL',
      });
    } else if (value.server === '' && !isHttpUrl(value.url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'Enter a valid URL',
      });
    }
  });

/**
 * A type alias for an MCP server input.
 */
export type McpServerInput = z.infer<typeof McpServerInputSchema>;

/**
 * The schema for an agent definition as entered in the authoring form.
 *
 * This is the UI's form model. Blank optional fields are empty strings here
 * and become `null` on the wire (see {@link buildRegisterAgentBody}).
 * `tools` and `databases` hold catalog keys.
 */
export const AgentDefinitionSchema = z.object({
  name: templateSafe(z.string().trim().min(1, 'Name is required').max(80)),
  description: templateSafe(z.string().trim().max(500)).default(''),
  instructions: templateSafe(
    z.string().trim().min(1, 'Instructions are required').max(20_000),
  ),
  model: z.string().min(1, 'Model is required').max(200),
  tools: z.array(z.string().min(1).max(63)).max(20).default([]),
  databases: z.array(z.string().min(1).max(63)).max(20).default([]),
  mcpServers: z.array(McpServerInputSchema).max(8).default([]),
  quickPrompts: z.array(QuickPromptInputSchema).max(12).default([]),
});

/**
 * A type alias for an agent definition.
 */
export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;

/**
 * An empty agent definition, for a fresh authoring form.
 */
export const EMPTY_AGENT_DEFINITION: AgentDefinition = {
  name: '',
  description: '',
  instructions: '',
  model: '',
  tools: [],
  databases: [],
  mcpServers: [],
  quickPrompts: [],
};

/**
 * The schema for the metadata the backend factory stashes on an agent.
 *
 * Lives at `capabilities.identity.metadata.nebariChat`. Static agents have
 * no such key, which is how the UI tells the two apart. Version 2 added
 * `tools`, `mcpServers` and `dataSources`.
 */
export const DynamicAgentMetadataSchema = z.object({
  nebariChat: z.object({
    kind: z.literal('dynamic'),
    version: z.literal(2),
    definition: z.object({
      name: z.string(),
      description: z.string().nullable(),
      instructions: z.string(),
      model: z.string(),
      tools: z.array(z.string()),
      mcpServers: z.array(
        z.object({
          server: z.string().optional(),
          url: z.string().optional(),
        }),
      ),
      dataSources: z.array(
        z.object({
          database: z.string().optional(),
          file: z.string().optional(),
        }),
      ),
    }),
    setupError: z.string().nullable(),
    createdAt: z.string(),
  }),
});

/**
 * A dynamic (user-authored) agent, as read back from the agent list.
 */
export type DynamicAgent = {
  /**
   * The agent id.
   */
  readonly id: string;

  /**
   * The authored definition, in form-model shape.
   */
  readonly definition: AgentDefinition;

  /**
   * The error recorded when the backend failed to discover the agent's
   * tools (e.g. an unreachable MCP server), or `null`.
   */
  readonly setupError: string | null;

  /**
   * When the agent was registered, as an ISO-8601 string.
   */
  readonly createdAt: string;
};

/**
 * Read a dynamic agent's authored definition back from its config.
 *
 * @returns The dynamic agent, or `null` for a static (config-declared) agent
 * or one written by an incompatible metadata version.
 */
export function getDynamicAgent(agent: AgentConfig): DynamicAgent | null {
  const parsed = DynamicAgentMetadataSchema.safeParse(
    agent.capabilities.identity?.metadata,
  );
  if (!parsed.success) {
    return null;
  }
  const { definition, setupError, createdAt } = parsed.data.nebariChat;
  return {
    id: agent.id,
    definition: {
      name: definition.name,
      description: definition.description ?? '',
      instructions: definition.instructions,
      model: definition.model,
      tools: definition.tools,
      databases: definition.dataSources.flatMap((source) =>
        source.database ? [source.database] : [],
      ),
      mcpServers: definition.mcpServers.map((server) => ({
        server: server.server ?? '',
        url: server.url ?? '',
      })),
      quickPrompts: agent.quickPrompts.map(toQuickPromptInput),
    },
    setupError,
    createdAt,
  };
}

/**
 * Convert an advertised quick prompt into its form-model shape.
 */
function toQuickPromptInput(prompt: QuickPrompt): QuickPromptInput {
  return {
    title: prompt.title,
    description: prompt.description ?? '',
    prompt: prompt.prompt,
  };
}

/**
 * Wrap text in a Jinja raw block so Ravnar's template rendering leaves it
 * verbatim.
 */
export function escapeTemplate(text: string): string {
  return `{% raw %}${text}{% endraw %}`;
}

/**
 * The wire body for `POST /api/agents`.
 */
export type RegisterAgentBody = {
  id: string;
  agent: {
    cls_or_fn: typeof AGENT_FACTORY;
    params: {
      name: string;
      description: string | null;
      instructions: string;
      model: string;
      tools: string[];
      mcp_servers: ({ server: string } | { url: string })[];
      data_sources: { database: string }[];
      quick_prompts: {
        title: string;
        description: string | null;
        prompt: string;
      }[];
    };
  };
};

/**
 * Build the registration body for an agent definition.
 *
 * Every string is raw-wrapped, including catalog keys, the model id and URLs,
 * so the payload is uniformly immune to template rendering; the backend
 * receives the unwrapped values.
 */
export function buildRegisterAgentBody(
  id: string,
  definition: AgentDefinition,
): RegisterAgentBody {
  const optional = (value: string): string | null =>
    value ? escapeTemplate(value) : null;
  return {
    id,
    agent: {
      cls_or_fn: AGENT_FACTORY,
      params: {
        name: escapeTemplate(definition.name),
        description: optional(definition.description),
        instructions: escapeTemplate(definition.instructions),
        model: escapeTemplate(definition.model),
        tools: definition.tools.map(escapeTemplate),
        mcp_servers: definition.mcpServers.map((server) =>
          server.server
            ? { server: escapeTemplate(server.server) }
            : { url: escapeTemplate(server.url) },
        ),
        data_sources: definition.databases.map((database) => ({
          database: escapeTemplate(database),
        })),
        quick_prompts: definition.quickPrompts.map((prompt) => ({
          title: escapeTemplate(prompt.title),
          description: optional(prompt.description),
          prompt: escapeTemplate(prompt.prompt),
        })),
      },
    },
  };
}

/**
 * Register a new dynamic agent.
 *
 * @param id - The client-generated agent id.
 *
 * @param definition - The validated agent definition.
 *
 * @returns The registered agent's config as advertised by the backend.
 */
export async function createAgent(
  id: string,
  definition: AgentDefinition,
): Promise<AgentConfig> {
  // Post the resource.
  const resp = await auth.fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRegisterAgentBody(id, definition)),
  });

  // Return the parsed result.
  return AgentConfigSchema.parse(await resp.json());
}

/**
 * Delete a dynamic agent.
 *
 * @param id - The agent id.
 */
export async function deleteAgent(id: string): Promise<void> {
  await auth.fetch(`/api/agents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
