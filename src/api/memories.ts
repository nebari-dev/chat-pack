/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import * as auth from '@/auth';

import type {
  Page, PageOptions
} from './common';


/**
 * A type alias for a single agentic memory.
 *
 * This type is used to display a row in an agentic memory table.
 */
export
type Memory = {
  /**
   * The unique id of the agent that created the memory.
   */
  readonly agentId: string;

  /**
   * The content that the agent saved for the memory.
   */
  readonly content: string;

  /**
   * The unique id of the memory.
   *
   * This will be used for deleting memories in the table.
   */
  readonly memoryId: string;

  /**
   * The short-form topics for which the memory is relevant.
   *
   * These will be rendered as pills/tokens in the table UI.
   */
  readonly topics: readonly string[];

  /**
   * The ISO UTC timestamp when the memory was last updated.
   */
  readonly updatedAt: string;
};


/**
 * A type alias for the `getMemories()` handler result.
 */
export
type MemoriesPage = Page<Memory>;


/**
 * Fetch the agentic memories subject to the options.
 *
 * @params options - The options for creating the request.
 *
 * @returns The agentic memories that have been stored for the user/agent.
 */
export
async function getMemories(_options: getMemories.Options): Promise<MemoriesPage> {
  // Ignore the pagination options for now.

  // Fetch the resource.
  const resp = await fetch('/api/memories', {
    headers: { 'Authorization': `Bearer ${auth.getAuthToken()}` }
  });

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Parse the response.
  const parsed = v.parse(Private.memoriesSchema, json);

  // Return the translated result.
  return {
    limit: parsed.data.length,
    pageNumber: 0,
    pageCount: 1,
    totalCount: parsed.data.length,
    items: parsed.data.map(mi => ({
      agentId: mi.agent_id,
      content: mi.memory,
      memoryId: mi.memory_id,
      topics: mi.topics,
      updatedAt: mi.updated_at
    }))
  };
}


/**
 * The namespace for the `getMemories` statics.
 */
export
namespace getMemories {
  /**
   * A type alias for the `getMemories` options.
   */
  export
  type Options = PageOptions<Memory> & {
    /**
     * The unique id of the agent for filtered results.
     *
     * If this is not provided, the server should return all agents.
     */
    readonly agentId?: string;
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
  const resp = await fetch('/api/memories', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.getAuthToken()}`
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
