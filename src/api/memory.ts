/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import {
  getAuthToken
} from '@/auth';


/**
 * A type alias for a single agentic memory.
 *
 * This type is used to display a row in an agentic memory table.
 */
export
type Memory = {
  /**
   * The unique id of the agent that create the memory.
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
type MemoriesPage = {
  /**
   * The limit of the number of responses per page.
   *
   * This is either echoed from the request, or defined by the server if
   * pagination info was provided in the request.
   */
  readonly limit: number;

  /**
   * The page number of the provided results.
   *
   * This must agree with the `limit`, `pageCount`, and `totalCount`.
   */
  readonly pageNumber: number;

  /**
   * The total number of pages available based on `limit` and `totalCount`.
   */
  readonly pageCount: number;

  /**
   * The total number of records available, independent of `limit`.
   */
  readonly totalCount: number;

  /**
   * The memories for the request.
   *
   * This must always be `<= limit`.
   */
  readonly memories: readonly Memory[];
};


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
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
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
 * The namespace for the `getMemories` statics.
 */
export
namespace getMemories {
  /**
   * A type alias for the `getMemories` options.
   */
  export
  type Options = {
    /**
     * The unique id of the agent for filtered results.
     *
     * If this is not provided, the server should return all agents.
     */
    readonly agentId?: string;

    /**
     * The pagination spec for filtering the request result.
     *
     * If this is not provided, the server is free to choose its own.
     */
    readonly pagination?: {
     /**
       * The upper limit of the number of responses to return per page.
       */
      readonly limit?: number;
      /**
       * The page to return based on the specified limit.
       */
      readonly page?: number;

      /**
       * The sort order based on the session last updated timestamp.
       */
      readonly sort?: 'ascending' | 'descending';
    };
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
