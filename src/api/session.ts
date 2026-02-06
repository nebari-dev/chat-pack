/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import type {
  JsonSchema, UISchemaElement
} from '@jsonforms/core';

import {
  getAuthToken
} from '@/auth';

import type {
  ReadonlyJSONObject, ReadonlyJSONValue
} from '@/lib/json';

import type {
  TokenMetrics
} from './metrics';


/**
 * A type alias of the common properties for all events.
 */
export
type EventCommon = {
  /**
   * The ISO UTC timestamp of the event.
   */
  readonly createdAt: string;

  /**
   * The unique id of the agent that triggered the event.
   */
  readonly agentId: string;

  /**
   * The unique of the run for the event.
   */
  readonly runId: string;

  /**
   * The unique of the session for the event.
   */
  readonly sessionId: string;
};


/**
 * A type alias for a `run-started` event.
 *
 * This event should be emitted at the start of a run, in response to
 * a new user submission, before the agent has generated any content.
 */
export
type RunStartedEvent = EventCommon & {
  /**
   * The discriminated type of the event.
   */
  readonly type: 'run-started';
};


/**
 * A type alias for a `run-continued` event.
 *
 * This event should be emitted when the agent generates streaming output.
 *
 * The UI will concatenate these content events as they are generated in
 * order to show the streaming results to the user.
 *
 * The `run-completed` event is used to show the final full authoritative
 * output to the user.
 */
export
type RunContentEvent = EventCommon & {
  /**
   * The discriminated type of the event.
   */
  readonly type: 'run-content';

  /**
   * The agent-generated streaming content chunk.
   */
  readonly content: string;
};


/**
 * A type alias for a human-in-the-loop user input form.
 *
 * This form uses JsonForms for rendering and handling the form. All of
 * the features defined by the JsonForms schemas are supported:
 *
 * https://jsonforms.io/docs/
 */
export
type UserInputForm = {
  /**
   * The unique id of the form.
   */
  readonly formId: string;

  /**
   * The initial data for the form.
   */
  readonly data: ReadonlyJSONObject;

  /**
   * The JsonForms schema for the form data.
   *
   * If this is not provided, one will be inferred by JsonForms.
   */
  readonly schema: JsonSchema | null;

  /**
   * The JsonForms schema for the form UI.
   *
   * If this is not provided, one will be inferred by JsonForms.
   */
  readonly uiSchema: UISchemaElement | null;
};


/**
 * A type alias for a `run-paused` event.
 *
 * This event should be emitted when the agent needs to pause execution
 * to get human-in-the-loop feedback before executing tool calls.
 *
 * The UI will only display a human-in-the-loop feedback form if a
 * `run-paused` event is the most recent event in the stream.
 */
export
type RunPausedEvent = EventCommon & {
  /**
   * The discriminated type of the event.
   */
  readonly type: 'run-paused';

  /**
   * The form that require user input.
   *
   * When the user has finished completing the form and "submits" it,
   * the updated form data is passed to the `ContinueRun` handler.
   */
  readonly form: UserInputForm;
};


/**
 * A type alias for a `run-continued` event.
 *
 * This event should be emitted immediately after the human has provided the
 * feedback needed for the prior `run-paused` event, before any other events
 * are generated.
 */
export
type RunContinuedEvent = EventCommon & {
  /**
   * The discriminated type of the event.
   */
  readonly type: 'run-continued';
};


/**
 * A type alias for a completed agent tool call.
 */
export
type ToolCall = {
  /**
   * The unique id of the tool being called.
   */
  readonly toolId: string;

  /**
   * The human readable name of the tool.
   */
  readonly toolName: string;

  /**
   * The arguments passed to the tool.
   */
  readonly toolArgs: ReadonlyJSONObject;

  /**
   * The result of the tool call.
   */
  readonly result: ReadonlyJSONValue;
};


/**
 * A type alias for a `tool-call` event.
 *
 * This event should be emitted when the agent has called a tool.
 *
 * Tool calls can be interleaved with other events as the agent calls tools.
 * The UI will visually hoist the tool calls to the top of the run.
 */
export
type ToolCallEvent = EventCommon & {
  /**
   * The discriminated type of the event.
   */
  readonly type: 'tool-call';

  /**
   * The tool call data for the tool that was called by the agent.
   */
  readonly toolCall: ToolCall;
};


/**
 * A type alias for a `run-completed` event.
 *
 * This event should be emitted as the very last event in the run.
 *
 * It is used as the final full authoritative output of the agent.
 */
export
type RunCompletedEvent = EventCommon & {
  /**
   * The discriminated type of the event.
   */
  readonly type: 'run-completed';

  /**
   * The full pre-concatenated response from the agent.
   */
  readonly content: string;
};


/**
 * A type alias for the application run events.
 */
export
type RunEvent = (
  RunStartedEvent |
  RunContentEvent |
  RunPausedEvent |
  RunContinuedEvent |
  ToolCallEvent |
  RunCompletedEvent
);


/**
 * A type alias for session info.
 *
 * This is used to render a summary row in the sessions table.
 */
export
type SessionInfo = {
  /**
   * The unique id for the session.
   */
  readonly sessionId: string;

  /**
   * The human readable name of the session.
   */
  readonly sessionName: string;

  /**
   * The ISO UTC timestamp of when the session was created.
   */
  readonly createdAt: string;

  /**
   * The ISO UTC timestamp of the most recent update to the session.
   */
  readonly updatedAt: string;
};


/**
 * A type alias for the `listSessions()` handler response.
 */
export
type SessionsPage = {
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
   * The session summaries for the request.
   *
   * This must always have `.length <= limit`.
   */
  readonly sessions: readonly SessionInfo[];
};


/**
 * A type alias for a chat summary message in a session.
 *
 * This type alias is a deliberate summary of the messages for a session
 * run. It omits tool calls, thinking, etc. It's just a summary intended
 * to be shown as a quick overview before the user re-opens the full chat
 * experience to continue interaction with the session.
 */
export
type ChatSummaryMessage = {
  /**
   * The role of the message.
   *
   * The `user` role is typically the user input text. Markdown is not
   * supported. It's just plain text.
   *
   * The `assistant` role is the concatenated output from the agent for
   * a single run. Markdown is supported, but tool calls are not. This
   * is just the pure text output from the agent for a single run.
   */
  readonly role: 'user' | 'assistant';

  /**
   * The ISO UTC timestamp for when the run was created.
   */
  readonly createdAt: string;

  /**
   * The text content for the user or assistant message.
   */
  readonly content: string;
};


/**
 * A type alias for the `getSessionDetail()` handler result.
 */
export
type SessionDetail = SessionInfo & {
  /**
   * The unique id of the agent for the session.
   */
  readonly agentId: string;

  /**
   * The aggregate token metrics for the session.
   */
  readonly tokenMetrics: TokenMetrics;

  /**
   * The array of summary messages for the session.
   *
   * These message are used to provide a quickly-rendered overview of the
   * session to allow the user to decide whether they want open the full
   * chat for the session and continue chatting.
   */
  readonly chatSummary: readonly ChatSummaryMessage[];
};


/**
 * A type alias for the `getSessionRuns()` handler result.
 *
 * This is used as the absolute source of truth for a session, which
 * includes all events to fully re-hydrate a session run from the
 * stored state.
 */
export
type SessionRun = {
  /**
   * The unique id for the agent for the run.
   */
  readonly agentId: string;

  /**
   * The ISO UTC timestamp of when the run was created.
   */
  readonly createdAt: string;

  /**
   * The event stream for the run.
   */
  readonly events: readonly RunEvent[];

  /**
   * The unique id for the run.
   */
  readonly runId: string;

  /**
   * The ISO UTC timestamp of the most recent update to the run.
   */
  readonly updatedAt: string;

  /**
   * The user prompt for the run.
   *
   * This is echoed from the user submitted prompt.
   */
  readonly userPrompt: string;
};


/**
 * Fetch the sesssion summaries subject to the options.
 *
 * @params options - The options for creating the request.
 *
 * @returns The paginated session summaries according to the request.
 */
export
async function listSessions(_options: listSessions.Options): Promise<SessionsPage> {
  // Ignore the pagination options for now.

  // Fetch the resource.
  const resp = await fetch(`/api/sessions?type=agent&sort_by=updated_at`, {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Guard against fetch failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Pase the response.
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
 * The namespace for the `listSessions` statics.
 */
export
namespace listSessions {
  /**
   * A type alias for the `listSessions` options.
   */
  export
  type Options = {
    /**
     * The agent id for filtering the session result.
     *
     * If this is not provided, all agents will be included in the result.
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
       * The sort order based on the session updated timestamp.
       */
      readonly sort?: 'ascending' | 'descending';
    };
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
  const resp = await fetch('/api/sessions', {
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
async function getSessionDetail(id: string): Promise<SessionDetail> {
  // Fetch the resource.
  const resp = await fetch(`/api/sessions/${id}?type=agent`, {
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
async function getSessionRuns(id: string): Promise<readonly SessionRun[]> {
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
async function *createRun(options: createRun.Options): AsyncGenerator<RunEvent> {
  throw 'not implemented';
}


/**
 * The namespace for the `createRun` statics.
 */
export
namespace createRun {
  /**
   * A type alias for the `createRun` options.
   */
  export
  type Options = {
    /**
     * The new session id for the run.
     *
     * This must be a random UUIDv4.
     *
     * This will be assigned by the client on a new submission.
     */
    readonly sessionId: string;

    /**
     * The unique id of the agent to handle the run.
     */
    readonly agentId: string;

    /**
     * The user prompt for the run.
     */
    readonly userPrompt: string;
  };
}


/**
 * Continue a session run after a human-in-the-loop pause.
 *
 * @param options - The options for continuing the run.
 *
 * @returns An async generator that continues the run events.
 */
export
async function *continueRun(options: continueRun.Options): AsyncGenerator<RunEvent> {
  throw 'not implemented';
}


/**
 * The namespace for the `continueRun` statics.
 */
export
namespace continueRun {
  /**
   * A type alias for the `continueRun` options.
   */
  export
  type Options = {
    /**
     * The unique session id to continue.
     */
    readonly sessionId: string;

    /**
     * The unique id of the run to continue.
     */
    readonly runId: string;

    /**
     * The id of the form that has been completed.
     */
    readonly formId: string;

    /**
     * The completed data for the form.
     */
    readonly formData: ReadonlyJSONObject;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
   // A schema for a sessions list item.
  const sessionsListItemSchema = v.object({
    session_id: v.string(),
    session_name: v.string(),
    created_at: v.string(),
    updated_at: v.string()
  });

   // A schema for a sessions list.
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
