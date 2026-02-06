/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import * as auth from '@/auth';


/**
 * A type alias for a quick prompt for a specific agent.
 *
 * This type is used to render the suggested prompts for an agent, before
 * user input has been submitted in the chat input for an agent/session.
 */
export
type QuickPrompt = {
  /**
   * The title of the quick prompt.
   *
   * This is used to render the title of the quick prompt card.
   */
  readonly title: string;

  /**
   * The short description of the quick prompt.
   *
   * This is used to render the description of the quick prompt card.
   */
  readonly description: string;

  /**
   * The actual user input for the quick prompt.
   *
   * This will be used as the agent prompt if the user clicks the card.
   */
  readonly prompt: string;
};


/**
 * A type alias for the details of an Agent in the application.
 *
 * This type is used to populate the agent dropdown selector, the chat
 * quick prompts, and other UI areas where the agent detail is needed.
 */
export
type AgentDetail = {
  /**
   * The unique id of the agent.
   */
  readonly agentId: string;

  /**
   * The human readable name of the agent.
   */
  readonly agentName: string;

  /**
   * The introduction message to the user.
   *
   * This is a short description of what the agent does and will be shown
   * at the start of an empty session.
   */
  readonly introduction: string;

  /**
   * The unique id of the model underlying the agent.
   */
  readonly modelId: string;

  /**
   * The human readable name of the model underlying the agent.
   */
  readonly modelName: string;

  /**
   * The provider hosting the underlying model.
   */
  readonly modelProvider: string;

  /**
   * The quick prompts to show for the agent in a new empty chat.
   */
  readonly quickPrompts: readonly QuickPrompt[];
};


/**
 * The global application config object.
 */
export
type Config = {
  /**
   * The unique id of the application.
   */
  readonly appId: string;

  /**
   * The human readable name of the application.
   */
  readonly appName: string;

  /**
   * The agents available to the application.
   */
  readonly agents: readonly AgentDetail[];
};


/**
 * Fetch the global application config object.
 *
 * This defines the top-level application config which, among other
 * things, defines which agents are available to the application.
 *
 * @returns The global application config object.
 */
export
async function getConfig(): Promise<Config> {
  // Fetch the Agno OS config.
  const configResp = await fetch('/api/config', {
    headers: { 'Authorization': `Bearer ${auth.getAuthToken()}` }
  });

  // Guard against request failure.
  if (!configResp.ok) {
    throw new Error(`Response: ${configResp.status} ${configResp.statusText}`);
  }

  // Convert the response to json.
  const configJSON = await configResp.json();

  // Fetch the Agno agents.
  const agentsResp = await fetch('/api/agents', {
    headers: { 'Authorization': `Bearer ${auth.getAuthToken()}` }
  });

  // Guard against request failure.
  if (!agentsResp.ok) {
    throw new Error(`Response: ${agentsResp.status} ${agentsResp.statusText}`);
  }

  // Convert the response to json.
  const agentsJSON = await agentsResp.json();

  // Parse the Agno OS config.
  const config = v.parse(Private.osConfigSchema, configJSON);

  // Parse the Agno agents details.
  const agents = v.parse(Private.agentsDetailSchema, agentsJSON);

  // Return the translated result.
  return {
    appId: config.os_id,
    appName: config.name,
    agents: agents.map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      introduction: agent.introduction,
      modelId: agent.model.model,
      modelName: agent.model.name,
      modelProvider: agent.model.provider,
      quickPrompts: [],  // TODO - quick prompts
    }))
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  // The schema for an Agno agent model.
  const modelSchema = v.object({
    name: v.fallback(v.string(), ''),
    model: v.fallback(v.string(), ''),
    provider: v.fallback(v.string(), '')
  });

  // The schema for the Agno agents details.
  export
  const agentsDetailSchema = v.array(v.object({
    id: v.string(),
    name: v.string(),
    introduction: v.fallback(v.string(), ''),
    model: modelSchema
  }));

  // The schema for an Agno OS config.
  export
  const osConfigSchema = v.object({
    os_id: v.string(),
    name: v.fallback(v.string(), '')
  });
}
