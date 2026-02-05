/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/


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
type GetMemories = (options: GetMemories.Options) => Promise<MemoriesPage>;


/**
 * The namespace for the `GetMemories` statics.
 */
export
namespace GetMemories {
  /**
   * A type alias for the `GetMemories` options.
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
