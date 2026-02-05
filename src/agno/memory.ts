/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import * as api from '@/api';

import {
  getAuthToken
} from '@/auth';


/**
 * Fetch the agentic memories subject to the options.
 *
 * @params options - The options for creating the request.
 *
 * @returns The agentic memories that have been stored for the user/agent.
 */
export
async function getMemories(_options: api.GetMemories.Options): Promise<api.MemoriesPage> {
  // Extract the options.
  //
  // Ignore the pagination options for Agno for now.

  // Fetch the resource.
  const resp = await fetch('/agno/memories', {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Parse the agno response.
  const parsed = v.parse(Private.memoriesSchema, json);

  // Return the translated result.
  return {
    limit: parsed.data.length,
    pageNumber: 0,
    pageCount: 1,
    totalCount: parsed.data.length,
    memories: parsed.data.map(mi => ({
      agentId: mi.agent_id,
      content: mi.memory,
      memoryId: mi.memory_id,
      topics: mi.topics,
      updatedAt: mi.updated_at
    }))
  };
}


/**
 * Delete memories from the server.
 *
 * @param ids - The array of memory ids to delete.
 *
 * @returns A promise that resolves at the completion of the delete.
 */
export
async function deleteMemories(ids: readonly string[]): Promise<void> {
  // Create the request.
  const resp = await fetch('/agno/memories', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ memory_ids: ids }),
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  // A schema for an Agno memory item.
  const memoryItemSchema = v.object({
    agent_id: v.string(),
    memory: v.string(),
    memory_id: v.string(),
    topics: v.array(v.string()),
    updated_at: v.string()
  });

  // A schema for Agno memories response.
  export
  const memoriesSchema = v.object({
    data: v.array(memoryItemSchema)
  });
}
