/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as z from 'zod';

import * as auth from '@/auth';


/**
 * The schema for a quick prompt for a specific agent.
 *
 * This type is used to render the suggested prompts for an agent, before
 * user input has been submitted in the chat input for an agent/session.
 */
export
const QuickPromptSchema = z.object({
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
  description: z.string(),

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
export
type QuickPrompt = z.infer<typeof QuickPromptSchema>;


/**
 * The schema for the details of an Agent in the application.
 *
 * This type is used to populate the agent dropdown selector, the chat
 * quick prompts, and other UI areas where the agent detail is needed.
 */
export
const AgentDetailSchema = z.object({
  /**
   * The unique id of the agent.
   */
  agentId: z.string(),

  /**
   * The human readable name of the agent.
   */
  agentName: z.string(),

  /**
   * The introduction message to the user.
   *
   * This is a short description of what the agent does and will be shown
   * at the start of an empty session.
   */
  introduction: z.string(),

  /**
   * The unique id of the model underlying the agent.
   */
  modelId: z.string(),

  /**
   * The human readable name of the model underlying the agent.
   */
  modelName: z.string(),

  /**
   * The provider hosting the underlying model.
   */
  modelProvider: z.string(),

  /**
   * The quick prompts to show for the agent in a new empty chat.
   */
  quickPrompts: z.array(QuickPromptSchema)
});


/**
 * A type alias for the details of an Agent in the application.
 */
export
type AgentDetail = z.infer<typeof AgentDetailSchema>;


/**
 * The schema for the global application config.
 */
export
const ConfigSchema = z.object({
  /**
   * The human readable name of the application.
   */
  appName: z.string(),

  /**
   * The agents available to the application.
   */
  agents: z.array(AgentDetailSchema)
});


/**
 * A type alias for the global application config.
 */
export
type Config = z.infer<typeof ConfigSchema>;


/**
 * Fetch the global application config.
 *
 * @returns The global application config.
 */
export
async function getConfig(): Promise<Config> {
  // Fetch the resource.
  const resp = await fetch('/api/config', {
    headers: { 'Authorization': `Bearer ${auth.getAuthToken()}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Return the parsed result.
  return ConfigSchema.parse(await resp.json());
}
