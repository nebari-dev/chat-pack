/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import {
  pb
} from './pb'


/**
 * The schema for the Agno config detail.
 */
export
const configDetailSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.nullish(v.string()),
  db_id: v.nullish(v.string()),
});


/**
 * A type alias for the Agno config detail.
 */
export
type ConfigDetail = v.InferOutput<typeof configDetailSchema>;


/**
 * The schema for an Agno OS config.
 */
export
const configSchema = v.object({
  os_id: v.string(),
  databases: v.array(v.string()),
  agents: v.array(configDetailSchema),
  teams: v.array(configDetailSchema),
  workflows: v.array(configDetailSchema),
  name: v.nullish(v.string()),
  description: v.nullish(v.string()),
  chat: v.optional(v.object({
    quick_prompts: v.record(v.string(), v.array(v.string()))
  }))
});


/**
 * A type alias for an Agno OS config.
 */
export
type Config = v.InferOutput<typeof configSchema>;


/**
 * A function which gets the Agent OS config.
 *
 * @returns A promise that resolves with the config.
 */
export
async function getConfig(): Promise<Config> {
  // Use VITE_API_URL from environment
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw new Error('VITE_API_URL is not defined');
  }

  // Fetch the agents list (since /agents/config is 404)
  const resp = await fetch(`${apiUrl}/agents`, {
    headers: { 'Authorization': `Bearer ${pb.authStore.token}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to json.
  const json = await resp.json();

  // If the response is an array (list of agents), wrap it in a synthetic config object
  if (Array.isArray(json)) {
    const syntheticConfig = {
      os_id: "education-platform",
      databases: [],
      agents: json, // The array from /agents matches configDetailSchema structure
      teams: [],
      workflows: [],
      name: "OpenTeams Education",
      description: "AI Education Platform"
    };
    return v.parse(configSchema, syntheticConfig);
  }

  // Parse and return the response if it matches schema
  return v.parse(configSchema, json);
}
