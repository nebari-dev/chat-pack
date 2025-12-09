/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


/**
 * A schema for Agno memories.
 */
export const MemoryItem = v.object({
  memory_id: v.string(),
  memory: v.string(),
  topics: v.array(v.string()),
  agent_id: v.nullable(v.string()),
  team_id: v.nullable(v.string()),
  user_id: v.string(),
  updated_at: v.string(),
});

export const MetaSchema = v.object({
  page: v.number(),
  limit: v.number(),
  total_pages: v.number(),
  total_count: v.number(),
  search_time_ms: v.number(),
});

export const MemoriesResponse = v.object({
  data: v.array(MemoryItem),
  meta: MetaSchema,
});


/**
 * A type alias for Agno metrics.
 */
export
type MemoriesResponse = v.InferOutput<typeof MemoriesResponse>;

export
type MemoryItem = v.InferOutput<typeof MemoryItem>;

export
async function getMemories(): Promise<MemoriesResponse> {
  const url = '/agno_memory';

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Response: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<MemoriesResponse>;
}

export async function deleteMemories(ids: string[]): Promise<void> {
  for (const id of ids) {
    const url = `/agno_memory/${id}`;

    const res = await fetch(url, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`Failed to delete memory ${id}: ${res.status} ${res.statusText}`);
    }
  }
}