/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';
import * as z from 'zod';
import * as auth from '@/auth';

/**
 * The schema for a quick prompt for a specific agent.
 *
 * This type is used to render the suggested prompts for an agent, before
 * user input has been submitted in the chat input for an agent/session.
 */
export const QuickPromptSchema = z.object({
  /**
   * The title of the quick prompt.
   *
   * This is used to render the title of the quick prompt card.
   */
  title: z.string(),

  /**
   * The short description of the quick prompt.
   *
   * This is used to render the description of the quick prompt card.
   */
  description: z.string().optional(),

  /**
   * The actual user input for the quick prompt.
   *
   * This will be used as the agent prompt if the user clicks the card.
   */
  prompt: z.string(),
});

/**
 * A type alias for a quick prompt for a specific agent.
 */
export type QuickPrompt = z.infer<typeof QuickPromptSchema>;

/**
 * The schema an Agent config in the application.
 *
 * This type is used to populate the agent dropdown selector, the chat
 * quick prompts, and other UI areas where the agent config is needed.
 */
export const AgentConfigSchema = z.object({
  /**
   * The unique id of the agent.
   */
  id: z.string(),

  /**
   * The capabilities of the agent.
   */
  capabilities: agui.AgentCapabilitiesSchema,

  /**
   * The quick prompts to show for the agent in a new empty chat.
   */
  quickPrompts: z.array(QuickPromptSchema),
});

/**
 * A type alias for an Agent config in the application.
 */
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * The schema for the global application config.
 */
export const AppConfigSchema = z.object({
  /**
   * Whether storage is enabled for the application.
   */
  storageEnabled: z.boolean(),
  /**
   * Whether dynamic agents are enabeld for the application.
   */
  dynamicAgentsEnabled: z.boolean(),
});

/**
 * A type alias for the global application config.
 */
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Fetch the global application config.
 *
 * @returns The global application config.
 */
export async function getAppConfig(): Promise<AppConfig> {
  // Fetch the resource.
  const resp = await auth.fetch('/api/config');

  // Return the parsed result.
  return AppConfigSchema.parse(await resp.json());
}

/**
 * Fetch the list of available agents.
 *
 * @returns The array of agent configs.
 */
export async function getAgents(): Promise<AgentConfig[]> {
  // Fetch the resource.
  const resp = await auth.fetch('/api/agents');

  // Return the parsed result.
  return z.array(AgentConfigSchema).parse(await resp.json());
}
