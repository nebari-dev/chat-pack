/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


/**
 * A schema for Agno sessions list metadata.
 */
export
const sessionsListMetaSchema = v.object({
  page: v.number(),
  limit: v.number(),
  total_pages: v.number(),
  total_count: v.number(),
  search_time_ms: v.number()
});


/**
 * A type alias for Agno sessions list metadata.
 */
export
type SessionsListMeta = v.InferOutput<typeof sessionsListMetaSchema>;


/**
 * A schema for an Agno sessions list item.
 */
export
const sessionsListItemSchema = v.object({
  session_id: v.string(),
  session_name: v.string(),
  created_at: v.string(),
  updated_at: v.string(),
  session_state: v.optional(v.object({}))
});


/**
 * A type alias for an Agno sessions list item.
 */
export
type SessionsListItem = v.InferOutput<typeof sessionsListItemSchema>;


/**
 * A schema for an Agno sessions list.
 */
export
const sessionsListSchema = v.object({
  data: v.array(sessionsListItemSchema),
  meta: sessionsListMetaSchema
});


/**
 * A type alias for an Agno sessions list.
 */
export
type SessionsList = v.InferOutput<typeof sessionsListSchema>;


/**
 * A function which fetches the agno sessions list.
 *
 * @param options - The options for the request.
 *
 * @returns A promise that resolves with the sessions request.
 */
export
async function listSessions(options: listSessions.Options): Promise<SessionsList> {
  // Extract the options.
  const { type } = options;

  // Fetch the resource.
  const resp = await fetch(`/api/sessions?type=${type}`);

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Return the parsed result.
  return v.parse(sessionsListSchema, json);
}


/**
 * The namespace for the `listSessions` statics.
 */
export
namespace listSessions {
  /**
   * A type alias for the options to `listSessions`.
   *
   * TODO support more options available in the api, like pagination.
   */
  export
  type Options = {
    /**
     * The type of sessions to query.
     */
    readonly type: 'agent' | 'team' | 'workflow';
  };
}
