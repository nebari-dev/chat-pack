/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  AGUIEvent, RunAgentInput
} from '@ag-ui/core';

import {
  EventSchemas
} from '@ag-ui/core';

import * as auth from '@/auth';

import {
  SSEParserStream
} from '@/lib/sse';


/**
 * Create an agent run and stream the results.
 *
 * @param options - The options for running the agent.
 *
 * @returns An async generator that streams the ag-ui events.
 */
export
async function *runAgent(options: runAgent.Options): AsyncGenerator<AGUIEvent> {
  // Extract the options.
  const { agentId, input } = options;

  // Fetch the resource.
  const resp = await fetch(`/api/agents/${agentId}/run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${auth.getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Setup the SSE stream parser.
  const stream = resp.body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new SSEParserStream());

  // Yield the parsed events.
  for await (const evt of stream) {
    // Parse the event data to json.
    const json = JSON.parse(evt.data);

    // Yield the parsed/validated event.
    yield EventSchemas.parse(json);
  }
}


/**
 * The namespace for the `runAgent` statics.
 */
export
namespace runAgent {
  /**
   * A type alias for the options to `runAgent()`.
   */
  export
  type Options = {
    /**
     * The unique id of the agent to run.
     */
    readonly agentId: string;

    /**
     * The input for running the agent.
     */
    readonly input: RunAgentInput;
  };
}
