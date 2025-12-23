/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


/**
 * The schema for the Agno config detail.
 */
export
const configDetailSchema = v.object({
  id: v.nullish(v.string()),
  name: v.nullish(v.string()),
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
  // Fetch the resource.
  const resp = await fetch('/api/config');

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to json.
  const json = await resp.json();

  // Parse and return the response.
  return v.parse(configSchema, json);
}
