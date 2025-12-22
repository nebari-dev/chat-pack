/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/


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
  const resp = await fetch('/agno_memory', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memory_ids: ids })
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }
}
