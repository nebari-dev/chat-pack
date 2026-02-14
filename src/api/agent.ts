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
 * @param input - The ag-ui input for the run.
 *
 * @returns An async generator that streams the ag-ui events.
 */
export
async function *runAgent(input: RunAgentInput): AsyncGenerator<AGUIEvent> {
  // Fetch the resource.
  const resp = await fetch('/api/run-agent', {
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
