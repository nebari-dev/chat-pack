/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/


/**
 * Delete sessions from the server.
 *
 * @param ids - The array of session ids to delete.
 *
 * @returns A promise that resolves at the completion of the delete.
 */
export
async function deleteSessions(options: deleteSessions.Options): Promise<void> {
  // Create the request.
  const resp = await fetch('/api/sessions', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }
}


/**
 * The namespace for the `deleteSessions` statics.
 */
export
namespace deleteSessions {
  /**
   * The options for the `deleteSessions` function.
   */
  export
  type Options = {
    /**
     * The ids of the sessions to delete.
     */
    readonly session_ids: readonly string[];

    /**
     * The type of each session in the `session_ids` array.
     *
     * This must be same length as `session_ids`.
     */
    readonly session_types: readonly ('agent' | 'team' | 'workflow')[];
  };
}
