/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import {
  SSEParserStream
} from '@/lib/sse';

import type {
  RunEvent, SessionByID
} from './types';

import {
  runEventSchema, sessionByIDSchema
} from './types';


/**
 * A function which creates a new session on the server.
 *
 * @returns The unique id of the created session.
 */
export
async function createSession(): Promise<string> {
  // Fetch the resource.
  const resp = await fetch('/sessions', { method: 'POST' });

  // Convert the response to json.
  const json = await resp.json();

  // Return the response.
  //
  // TODO make a schema for this response and validate it.
  return json.session_id;
}


/**
 * A function which executes the Agno Agent Run API.
 *
 * @param options - The options for the API request.
 *
 * @returns An async generator of run events.
 */
export
async function *runAgent(options: runAgent.Options): AsyncGenerator<RunEvent> {
  // Extract the options.
  const { agent_id, message, session_id, user_id } = options;

  // Create the form data for the request.
  const fd = new FormData();

  // Set the required form data.
  fd.append('message', message);
  fd.append('stream', 'true');

  // Set the optional form data.
  if (session_id) {
    fd.append('session_id', session_id);
  }
  if (user_id) {
    fd.append('user_id', user_id);
  }

  // Fetch the endpoint.
  const resp = await fetch(`/agents/${agent_id}/runs`, {
    method: 'POST', body: fd
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Setup the SSE stream parser.
  const stream = resp.body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new SSEParserStream());

  // Yield the run events.
  for await (const evt of stream) {
    // Parse the SSE data into json.
    const json = JSON.parse(evt.data);

    // Validate the JSON against the schema.
    try {
      yield v.parse(runEventSchema, json);
    } catch (e) {
      // TODO log errors and json for unhandled events for now.
      console.log('Failed to parse in `runAgent()`');
      console.log(e);
      console.log(json);
    }
  }
}


/**
 * The namespace for the `runAgent` statics.
 */
export
namespace runAgent {
  /**
   * An options object for a `runAgent` request.
   */
  export
  type Options = {
    /**
     * The id of the agent to invoke.
     */
    readonly agent_id: string;

    /**
     * The user message to the agent.
     */
    readonly message: string;

    /**
     * The unique id of the existing session for the agent.
     */
    readonly session_id: string;

    /**
     * The unique id of the user making the request.
     */
    readonly user_id?: string;
  };
}


/**
 * A function which fetches a session history by id.
 *
 * @param options - The options for the API requestion.
 *
 * @returns A Promise which resolves to the loaded data.
 */
export
async function getSessionByID(options: getSessionByID.Options): Promise<SessionByID> {
  // Extract the options.
  const { session_id, type, user_id } = options;

  // Setup the search params.
  const params = new URLSearchParams();

  // Add the type to the search params if it exists.
  if (type) {
    params.append('type', type);
  }

  // Add the user id to the search params if it exists.
  if (user_id) {
    params.append('user_id', user_id);
  }

  // Construct the fetch url.
  const url = `/sessions/${session_id}?` + params;

  // Make the fetch request.
  const resp = await fetch(url);

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to JSON.
  const json = await resp.json();

  // Parse the results.
  return v.parse(sessionByIDSchema, json);
}


/**
 * The namespace for the `getSessionByID` statics.
 */
export
namespace getSessionByID {
  /**
   * The options object for a `getSessionByID` request.
   */
  export
  type Options = {
    /**
     * The unique id of the session.
     */
    readonly session_id: string;

    /**
     * The session type for filtering, if needed.
     */
    readonly type?: 'agent' | 'team' | 'workflow';

    /**
     * The user id for filtering, if needed.
     */
    readonly user_id?: string;
  };
}
