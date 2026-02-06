/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import * as api from '@/api';

import {
  getAuthToken
} from '@/auth';


/**
 * Fetch the sesssion summaries subject to the options.
 *
 * @params options - The options for creating the request.
 *
 * @returns The paginated session summaries according to the request.
 */
export
async function listSessions(_options: api.ListSessions.Options): Promise<api.SessionsPage> {
  // Ignore the pagination options for now.

  // Fetch the resource.
  const resp = await fetch(`/agno/sessions?type=agent&sort_by=updated_at`, {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Pase the agno response.
  const parsed = v.parse(Private.sessionsListSchema, json);

  // Return the translated result.
  return {
    limit: parsed.data.length,
    pageNumber: 0,
    pageCount: 1,
    totalCount: parsed.data.length,
    sessions: parsed.data.map(si => ({
      createdAt: si.created_at,
      sessionId: si.session_id,
      sessionName: si.session_name,
      updatedAt: si.updated_at
    }))
  };
}


/**
 * Delete sessions from the server.
 *
 * @param ids - The array of session ids to delete.
 *
 * @returns A promise that resolves at the completion of the delete.
 */
export
async function deleteSessions(ids: readonly string[]): Promise<void> {
  // Create the request.
  const resp = await fetch('/agno/sessions', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ session_ids: ids }),
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }
}


/**
 * Fetch the details for a particular session.
 *
 * @params id - The session id of interest.
 *
 * @returns The details of the specified session, minus its runs. This
 *   result is useful for generating a medium-overview of the session.
 */
export
async function getSessionDetail(id: string): Promise<api.SessionDetail> {
  // Fetch the resource.
  const resp = await fetch(`/agno/sessions/${id}?type=agent`, {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Parse the Agno response
  const parsed = v.parse(Private.sessionDetailSchema, json);

  // Return the translated result.
  return {
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
    sessionId: parsed.session_id,
    sessionName: parsed.session_name,
    agentId: parsed.agent_id,
    tokenMetrics: {
      inputTokens: parsed.metrics.input_tokens,
      outputTokens: parsed.metrics.output_tokens,
      totalTokens: parsed.metrics.output_tokens
    },
    chatSummary: parsed.chat_history.map(ch => ({
      role: ch.role,
      createdAt: new Date(ch.created_at).toISOString(),
      content: ch.content
    }))
  }
}


/**
 * Fetch the runs for a particular session.
 *
 * @params id - The session id of interest.
 *
 * @returns A full and complete history of the session runs. This can be
 *   used to restore the full state of a session from history.
 */
export
async function getSessionRuns(id: string): Promise<readonly api.SessionRun[]> {
  return [];
}


/**
 * Create a new session run according the options.
 *
 * @param options - The options for creating the run.
 *
 * @returns An async generator that streams run events.
 */
export
async function *createRun(options: api.CreateRun.Options): AsyncGenerator<api.RunEvent> {
  throw 'not implemented';
}


/**
 * Continue a session run after a human-in-the-loop pause.
 *
 * @param options - The options for continuing the run.
 *
 * @returns An async generator that continues the run events.
 */
export
async function *continueRun(options: api.ContinueRun.Options): AsyncGenerator<api.RunEvent> {
  throw 'not implemented';
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
   // A schema for an Agno sessions list item.
  const sessionsListItemSchema = v.object({
    session_id: v.string(),
    session_name: v.string(),
    created_at: v.string(),
    updated_at: v.string()
  });

   // A schema for an Agno sessions list.
  export
  const sessionsListSchema = v.object({
    data: v.array(sessionsListItemSchema),
  });

  // A schema for session token metrics.
  const metricsSchema = v.object({
    input_tokens: v.number(),
    output_tokens: v.number(),
    total_tokens: v.number()
  });

  // A schema for a chat history message.
  const chatHistoryMessageSchema = v.object({
    created_at: v.number(),
    content: v.fallback(v.string(), ''),
    role: v.union([
      v.literal('assistant'),
      v.literal('user')
    ])
  });

  // A schema for an `agent` session.
  export
  const sessionDetailSchema = v.object({
    created_at: v.string(),
    session_id: v.string(),
    session_name: v.string(),
    updated_at: v.string(),
    agent_id: v.string(),
    metrics: metricsSchema,
    chat_history: v.array(chatHistoryMessageSchema)
  });
}
