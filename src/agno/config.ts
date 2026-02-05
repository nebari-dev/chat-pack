/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import * as api from '@/api';

import {
  getAuthToken
} from '@/auth';


/**
 * Fetch the global application config object.
 *
 * This defines the top-level application config which, among other
 * things, defines which agents are available to the application.
 *
 * @returns The global application config object.
 */
export
async function getConfig(): Promise<api.Config> {
  // Fetch the Agno OS config.
  const configResp = await fetch('/agno/config', {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Guard against request failure.
  if (!configResp.ok) {
    throw new Error(`Response: ${configResp.status} ${configResp.statusText}`);
  }

  // Convert the response to json.
  const configJSON = await configResp.json();

  // Fetch the Agno agents.
  const agentsResp = await fetch('/agno/agents', {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
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
