/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';
import {
  pb
} from './pb'

/**
 * A schema for an Agno memory item.
 */
export
const memoryItemSchema = v.object({
  memory_id: v.string(),
  memory: v.string(),
  topics: v.array(v.string()),
  agent_id: v.nullable(v.string()),
  team_id: v.nullable(v.string()),
  user_id: v.string(),
  updated_at: v.string(),
});


/**
 * A type alias for an Agno memory item.
 */
export
type MemoryItem = v.InferOutput<typeof memoryItemSchema>;


/**
 * A schema for Agno memory metadata.
 */
export
const memoriesMetaSchema = v.object({
  page: v.number(),
  limit: v.number(),
  total_pages: v.number(),
  total_count: v.number(),
  search_time_ms: v.number(),
});


/**
 * A type alias for Agno memory metadata.
 */
export
type MemoriesMeta = v.InferOutput<typeof memoriesMetaSchema>;


/**
 * A schema for Agno memories.
 */
export
const memoriesSchema = v.object({
  data: v.array(memoryItemSchema),
  meta: memoriesMetaSchema,
});


/**
 * A type alias for Agno memories.
 */
export
type Memories = v.InferOutput<typeof memoriesSchema>;


/**
 * A function which fetches the agno memories.
 *
 * @returns A promise that resolves with the memories request.
 *
 * TODO add query options supported by Agno.
 */
export
async function getMemories(): Promise<Memories> {
  // Fetch the resource.
  const resp = await fetch('/api/memories', {
    headers: { 'Authorization': `Bearer ${pb.authStore.token}` }
  });

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Return the parsed result.
  return v.parse(memoriesSchema, json);
}
